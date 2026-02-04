use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use native_tls::{Certificate, TlsConnector};
use postgres_native_tls::MakeTlsConnector;
use serde::{Deserialize, Serialize};
use tokio_postgres::{tls::MakeTlsConnect, Client, Config, NoTls, SimpleQueryMessage};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PlanDialect {
    Dws,
    Opengauss,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SslMode {
    Disable,
    Require,
}

impl Default for SslMode {
    fn default() -> Self {
        Self::Disable
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum PerfMode {
    #[default]
    Normal,
    Fast,
    Slow,
}

impl PerfMode {
    fn to_value(&self) -> &'static str {
        match self {
            PerfMode::Fast => "fast",
            PerfMode::Slow => "slow",
            PerfMode::Normal => "normal",
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ExplainOptions {
    pub statement_timeout_ms: Option<u64>,
    #[serde(default)]
    pub perf_mode: PerfMode,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub user: String,
    pub password: String,
    #[serde(default)]
    pub ssl_mode: SslMode,
    pub application_name: Option<String>,
    #[serde(default)]
    pub allow_invalid_certs: bool,
    pub ca_certificate_pem: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplainRequest {
    pub dialect: PlanDialect,
    pub sql: String,
    pub title: Option<String>,
    pub connection: ConnectionConfig,
    #[serde(default)]
    pub options: ExplainOptions,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplainResponse {
    pub plan_text: String,
    pub dialect: PlanDialect,
    pub title: String,
    pub captured_at: String,
}

pub async fn execute_explain(request: ExplainRequest) -> Result<ExplainResponse> {
    let client = connect(request.connection.clone()).await?;

    apply_session_settings(&client, &request).await?;

    let explain_sql = format!("EXPLAIN PERFORMANCE {}", request.sql);
    let messages = client
        .simple_query(&explain_sql)
        .await
        .with_context(|| "failed to execute EXPLAIN PERFORMANCE")?;
    let plan_text = collect_messages(messages);

    if plan_text.trim().is_empty() {
        return Err(anyhow!("No plan output returned"));
    }

    let title = request
        .title
        .clone()
        .unwrap_or_else(|| summarize_sql(&request.sql));

    Ok(ExplainResponse {
        plan_text,
        dialect: request.dialect,
        title,
        captured_at: chrono::Utc::now().to_rfc3339(),
    })
}

async fn connect(connection: ConnectionConfig) -> Result<Client> {
    let mut config = Config::new();
    config.host(&connection.host);
    config.port(connection.port);
    config.user(&connection.user);
    config.password(&connection.password);
    config.dbname(&connection.database);
    config.application_name(
        connection
            .application_name
            .as_deref()
            .unwrap_or("HuaweiPlanVisualizer"),
    );
    config.connect_timeout(Duration::from_secs(10));

    if connection.ssl_mode == SslMode::Disable {
        let (client, conn) = config
            .connect(NoTls)
            .await
            .map_err(|err| anyhow!("failed to connect: {err}"))?;
        tokio::task::spawn_local(async move {
            if let Err(err) = conn.await {
                eprintln!("connection error: {err:?}");
            }
        });
        Ok(client)
    } else {
        let tls = build_tls(&connection)?;
        let (client, conn) = config
            .connect(tls)
            .await
            .map_err(|err| anyhow!("failed to connect (TLS): {err}"))?;
        tokio::task::spawn_local(async move {
            if let Err(err) = conn.await {
                eprintln!("connection error: {err:?}");
            }
        });
        Ok(client)
    }
}

fn build_tls(connection: &ConnectionConfig) -> Result<impl MakeTlsConnect<tokio_postgres::Socket>> {
    let mut builder = TlsConnector::builder();
    if connection.allow_invalid_certs {
        builder.danger_accept_invalid_certs(true);
    }
    if let Some(pem) = &connection.ca_certificate_pem {
        let cert = Certificate::from_pem(pem.as_bytes()).context("Invalid CA certificate")?;
        builder.add_root_certificate(cert);
    }
    let connector = builder.build().context("Unable to build TLS connector")?;
    Ok(MakeTlsConnector::new(connector))
}

async fn apply_session_settings(client: &Client, request: &ExplainRequest) -> Result<()> {
    let mut commands = Vec::new();
    if let Some(timeout_ms) = request.options.statement_timeout_ms {
        commands.push(format!("SET statement_timeout TO '{}ms'", timeout_ms));
    }
    match request.dialect {
        PlanDialect::Dws | PlanDialect::Opengauss => {
            commands.push(format!(
                "SET explain_perf_mode TO {}",
                request.options.perf_mode.to_value()
            ));
        }
    }
    for cmd in commands {
        client
            .batch_execute(&cmd)
            .await
            .with_context(|| format!("Failed to run session command: {cmd}"))?;
    }
    Ok(())
}

fn collect_messages(messages: Vec<SimpleQueryMessage>) -> String {
    let mut output = String::new();
    for message in messages {
        if let SimpleQueryMessage::Row(row) = message {
            let mut first = true;
            for idx in 0..row.len() {
                if let Some(value) = row.get(idx) {
                    if !first {
                        output.push('\t');
                    }
                    output.push_str(value);
                    first = false;
                }
            }
            output.push('\n');
        }
    }
    output
}

fn summarize_sql(sql: &str) -> String {
    let trimmed = sql.trim();
    let first_line = trimmed.lines().next().unwrap_or(trimmed);
    first_line.chars().take(80).collect()
}
