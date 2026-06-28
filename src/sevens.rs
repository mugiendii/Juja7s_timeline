use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::Value;
use tokio::time::{interval, Duration};

use crate::SharedState;

// ── Poller: pulls from the sevens_System public API every 5s ──────────────────

pub async fn run(state: SharedState, base_url: String) {
    {
        let mut s = state.write().await;
        s.sevens_api_url = base_url.clone();
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .unwrap_or_default();

    let mut tick = interval(Duration::from_secs(5));
    loop {
        tick.tick().await;
        if let Err(e) = poll(&client, &base_url, &state).await {
            eprintln!("[sevens] {e}");
        }
    }
}

async fn poll(
    client: &reqwest::Client,
    base:   &str,
    state:  &SharedState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let tournament: Value = client
        .get(format!("{base}/public/tournament"))
        .send().await?.json().await?;

    let schedule: Vec<Value> = client
        .get(format!("{base}/public/schedule"))
        .send().await?.json().await?;

    let pools: Vec<Value> = client
        .get(format!("{base}/public/pools"))
        .send().await?.json().await?;

    let mut s = state.write().await;
    s.sevens_tournament = Some(tournament);
    s.sevens_schedule   = schedule;
    s.sevens_pools      = pools;
    Ok(())
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/// GET /api/sevens/tournament — cached tournament metadata
pub async fn get_tournament(State(state): State<SharedState>) -> Json<Option<Value>> {
    Json(state.read().await.sevens_tournament.clone())
}

/// GET /api/sevens/schedule — cached ordered match list
pub async fn get_schedule(State(state): State<SharedState>) -> Json<Vec<Value>> {
    Json(state.read().await.sevens_schedule.clone())
}

/// GET /api/sevens/pools — cached pool standings (won/drawn/lost, points, tie-breaks)
pub async fn get_pools(State(state): State<SharedState>) -> Json<Vec<Value>> {
    Json(state.read().await.sevens_pools.clone())
}

/// GET /api/sevens/match/{id} — proxied live from the sevens system
pub async fn get_match(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, String)> {
    let api_url = state.read().await.sevens_api_url.clone();
    if api_url.is_empty() {
        return Err((StatusCode::SERVICE_UNAVAILABLE, "SEVENS_API_URL not set".into()));
    }

    let v: Value = reqwest::Client::new()
        .get(format!("{api_url}/public/match/{id}"))
        .send().await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?
        .json().await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    Ok(Json(v))
}
