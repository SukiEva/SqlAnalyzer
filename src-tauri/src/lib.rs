use serde::{Deserialize, Serialize};
use tokio_postgres::{Client, Config, NoTls};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunExplainRequest {
    driver: String,
    connection_string: String,
    username: String,
    password: String,
    sql: String,
    mode: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RunExplainResponse {
    plan_source: String,
    format: String,
}

#[tauri::command]
async fn run_explain(payload: RunExplainRequest) -> Result<RunExplainResponse, String> {
    let sql = payload.sql.trim().trim_end_matches(';');
    if sql.is_empty() {
        return Err("SQL is empty".to_string());
    }
    let conn_str = payload.connection_string.trim();
    if conn_str.is_empty() {
        return Err("Connection string is empty".to_string());
    }

    let mut config: Config = conn_str.parse::<Config>().map_err(|e| e.to_string())?;
    if !payload.username.trim().is_empty() {
        config.user(payload.username.trim());
    }
    if !payload.password.trim().is_empty() {
        config.password(payload.password.trim());
    }

    let client = connect_with_fallback(config).await.map_err(|e| e.to_string())?;

    let queries = build_queries(&payload.driver, &payload.mode, sql);
    let (plan_source, format) = execute_queries(&client, queries)
        .await
        .map_err(|e| e.to_string())?;

    Ok(RunExplainResponse { plan_source, format })
}

async fn connect_with_fallback(config: Config) -> anyhow::Result<Client> {
    let tls_config = native_tls::TlsConnector::builder().build()?;
    let tls = postgres_native_tls::MakeTlsConnector::new(tls_config);
    let config_clone = config.clone();

    match config.connect(tls).await {
        Ok((client, connection)) => {
            tauri::async_runtime::spawn(async move {
                if let Err(err) = connection.await {
                    eprintln!("postgres connection error: {err}");
                }
            });
            Ok(client)
        }
        Err(_) => {
            let (client, connection) = config_clone.connect(NoTls).await?;
            tauri::async_runtime::spawn(async move {
                if let Err(err) = connection.await {
                    eprintln!("postgres connection error: {err}");
                }
            });
            Ok(client)
        }
    }
}

fn build_queries(driver: &str, mode: &str, sql: &str) -> Vec<(String, &'static str)> {
    let driver = driver.to_lowercase();
    let mode = mode.to_lowercase();

    if driver == "postgresql" {
        let query = match mode.as_str() {
            "analyze" => format!("EXPLAIN (ANALYZE, FORMAT JSON) {sql}"),
            "performance" => format!("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {sql}"),
            _ => format!("EXPLAIN (FORMAT JSON) {sql}"),
        };
        let fallback = match mode.as_str() {
            "analyze" => format!("EXPLAIN ANALYZE {sql}"),
            "performance" => format!("EXPLAIN ANALYZE {sql}"),
            _ => format!("EXPLAIN {sql}"),
        };
        return vec![(query, "json"), (fallback, "text")];
    }

    let query = match mode.as_str() {
        "performance" => format!("EXPLAIN PERFORMANCE {sql}"),
        "analyze" => format!("EXPLAIN ANALYZE {sql}"),
        _ => format!("EXPLAIN {sql}"),
    };

    vec![(query, "text")]
}

async fn execute_queries(client: &Client, queries: Vec<(String, &'static str)>) -> anyhow::Result<(String, String)> {
    let mut last_error: Option<anyhow::Error> = None;

    for (query, format) in queries {
        match fetch_plan(client, &query, format).await {
            Ok(plan) => return Ok((plan, format.to_string())),
            Err(err) => last_error = Some(err),
        }
    }

    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Failed to execute EXPLAIN")))
}

async fn fetch_plan(client: &Client, query: &str, format: &str) -> anyhow::Result<String> {
    let rows = client.query(query, &[]).await?;
    if rows.is_empty() {
        return Ok("".to_string());
    }

    if format == "json" {
        let value: serde_json::Value = rows[0].try_get(0)?;
        return Ok(serde_json::to_string_pretty(&value)?);
    }

    let mut lines = Vec::new();
    for row in rows {
        let line: String = row.try_get(0)?;
        lines.push(line);
    }
    Ok(lines.join("\n"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_explain])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
