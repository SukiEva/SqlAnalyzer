use std::{fs, path::PathBuf, sync::Arc};

use aes_gcm::{aead::Aead, aead::KeyInit, Aes256Gcm, Key, Nonce};
use anyhow::{anyhow, Context, Result};
use data_encoding::BASE64;
use directories::ProjectDirs;
use keyring::Entry;
use rand::{rngs::OsRng, RngCore};
use serde_json::Value;
use std::sync::Mutex;

const KEY_SERVICE: &str = "HuaweiPlanVisualizer";
const KEY_ACCOUNT: &str = "plan_vault_key";
const VAULT_FILE: &str = "plans.bin";

#[derive(Clone)]
pub struct VaultState {
    inner: Arc<PlanVault>,
}

impl VaultState {
    pub fn initialize() -> Result<Self> {
        let vault = PlanVault::new()?;
        Ok(Self {
            inner: Arc::new(vault),
        })
    }

    pub fn handle(&self) -> Arc<PlanVault> {
        self.inner.clone()
    }
}

pub struct PlanVault {
    path: PathBuf,
    guard: Mutex<()>,
}

impl PlanVault {
    pub fn new() -> Result<Self> {
        let dirs = ProjectDirs::from("com", "Huawei", "PlanVisualizer")
            .ok_or_else(|| anyhow!("Unable to determine data directory"))?;
        let dir = dirs.data_dir();
        fs::create_dir_all(dir).context("Failed to create data directory")?;
        let path = dir.join(VAULT_FILE);
        Ok(Self {
            path,
            guard: Mutex::new(()),
        })
    }

    pub fn store_plan(&self, mut plan: Value) -> Result<()> {
        let _lock = self.guard.lock().expect("vault poisoned");
        let mut entries = self.load_all().unwrap_or_default();
        let plan_id = extract_id(&plan)?;
        entries.retain(|entry| extract_id(entry).ok().as_deref() != Some(plan_id.as_str()));
        entries.insert(0, plan.take());
        if entries.len() > 50 {
            entries.truncate(50);
        }
        self.save_all(&entries)
    }

    pub fn list_plans(&self) -> Result<Vec<Value>> {
        let _lock = self.guard.lock().expect("vault poisoned");
        self.load_all()
    }

    pub fn delete_plan(&self, plan_id: &str) -> Result<()> {
        let _lock = self.guard.lock().expect("vault poisoned");
        let mut entries = self.load_all()?;
        entries.retain(|entry| extract_id(entry).ok().as_deref() != Some(plan_id));
        self.save_all(&entries)
    }

    fn load_all(&self) -> Result<Vec<Value>> {
        if !self.path.exists() {
            return Ok(Vec::new());
        }
        let encrypted = fs::read(&self.path).context("Failed to read vault file")?;
        if encrypted.is_empty() {
            return Ok(Vec::new());
        }
        let plaintext = self.decrypt(&encrypted).context("Failed to decrypt vault")?;
        serde_json::from_slice(&plaintext).context("Invalid vault payload")
    }

    fn save_all(&self, entries: &[Value]) -> Result<()> {
        let plaintext = serde_json::to_vec(entries).context("Unable to serialize plans")?;
        let blob = self.encrypt(&plaintext)?;
        fs::write(&self.path, blob).context("Failed to write vault file")
    }

    fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>> {
        let cipher = self.cipher()?;
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        let mut ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|_| anyhow!("Encryption failed"))?;
        let mut blob = nonce_bytes.to_vec();
        blob.append(&mut ciphertext);
        Ok(blob)
    }

    fn decrypt(&self, ciphertext: &[u8]) -> Result<Vec<u8>> {
        if ciphertext.len() < 12 {
            return Err(anyhow!("Ciphertext too short"));
        }
        let (nonce_bytes, payload) = ciphertext.split_at(12);
        let cipher = self.cipher()?;
        cipher
            .decrypt(Nonce::from_slice(nonce_bytes), payload)
            .map_err(|_| anyhow!("Failed to decrypt"))
    }

    fn cipher(&self) -> Result<Aes256Gcm> {
        let key_bytes = fetch_or_create_key()?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        Ok(Aes256Gcm::new(key))
    }
}

fn extract_id(value: &Value) -> Result<String> {
    value
        .pointer("/summary/id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| anyhow!("Plan summary missing id"))
}

fn fetch_or_create_key() -> Result<[u8; 32]> {
    let entry = Entry::new(KEY_SERVICE, KEY_ACCOUNT).context("Keyring unavailable")?;
    if let Ok(secret) = entry.get_password() {
        let bytes = BASE64
            .decode(secret.as_bytes())
            .map_err(|_| anyhow!("Invalid key material"))?;
        return bytes
            .try_into()
            .map_err(|_| anyhow!("Unexpected key length"));
    }
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    entry
        .set_password(&BASE64.encode(&key))
        .context("Failed to store key material")?;
    Ok(key)
}
