mod db;
mod vault;

use db::{execute_explain, ExplainRequest, ExplainResponse};
use serde_json::Value;
use tauri::State;
use vault::VaultState;

#[tauri::command]
async fn run_explain(request: ExplainRequest) -> Result<ExplainResponse, String> {
    let handle = tauri::async_runtime::spawn_blocking(move || {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|err| err.to_string())?;
        let local = tokio::task::LocalSet::new();
        local
            .block_on(&runtime, async move { execute_explain(request).await })
            .map_err(|err| err.to_string())
    });

    handle
        .await
        .map_err(|err| err.to_string())?
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn store_plan_execution(plan: Value, state: State<'_, VaultState>) -> Result<(), String> {
    let vault = state.inner().handle();
    let result = tauri::async_runtime::spawn_blocking(move || vault.store_plan(plan))
        .await
        .map_err(|err| err.to_string())?;
    result.map_err(|err| err.to_string())
}

#[tauri::command]
async fn load_plan_history(state: State<'_, VaultState>) -> Result<Vec<Value>, String> {
    let vault = state.inner().handle();
    let result = tauri::async_runtime::spawn_blocking(move || vault.list_plans())
        .await
        .map_err(|err| err.to_string())?;
    result.map_err(|err| err.to_string())
}

#[tauri::command]
async fn delete_plan_history(id: String, state: State<'_, VaultState>) -> Result<(), String> {
    let vault = state.inner().handle();
    let result = tauri::async_runtime::spawn_blocking(move || vault.delete_plan(&id))
        .await
        .map_err(|err| err.to_string())?;
    result.map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vault_state = VaultState::initialize().expect("Unable to initialize vault");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(vault_state)
        .invoke_handler(tauri::generate_handler![
            run_explain,
            store_plan_execution,
            load_plan_history,
            delete_plan_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
