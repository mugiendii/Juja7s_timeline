use axum::{response::Html, routing::get, Router};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::{cors::CorsLayer, services::ServeDir};

mod data;
mod sevens;
mod theme;

pub type SharedState = Arc<RwLock<data::AppState>>;

const HOME_TMPL:     &str = include_str!("../templates/home.html");
const TIMELINE_TMPL: &str = include_str!("../templates/timeline.html");
const POOLS_TMPL:    &str = include_str!("../templates/pools.html");
const MATCH_TMPL:    &str = include_str!("../templates/match.html");

#[tokio::main]
async fn main() {
    let theme = theme::Theme::from_env();
    let state: SharedState = Arc::new(RwLock::new(data::AppState::new(theme)));

    if let Ok(api_url) = std::env::var("SEVENS_API_URL") {
        tokio::spawn(sevens::run(state.clone(), api_url));
    } else {
        eprintln!("[warn] SEVENS_API_URL not set — schedule will stay empty");
    }

    let app = Router::new()
        .route("/", get(|s: axum::extract::State<SharedState>| render(s, HOME_TMPL)))
        .route("/timeline", get(|s: axum::extract::State<SharedState>| render(s, TIMELINE_TMPL)))
        .route("/pools", get(|s: axum::extract::State<SharedState>| render(s, POOLS_TMPL)))
        .route("/match.html", get(|s: axum::extract::State<SharedState>| render(s, MATCH_TMPL)))
        .route("/api/sevens/tournament", get(sevens::get_tournament))
        .route("/api/sevens/schedule",   get(sevens::get_schedule))
        .route("/api/sevens/pools",      get(sevens::get_pools))
        .route("/api/sevens/match/{id}", get(sevens::get_match))
        .fallback_service(ServeDir::new("static"))
        .with_state(state)
        .layer(CorsLayer::permissive());

    let addr = "0.0.0.0:3000";
    println!("Branded timeline running → http://localhost:3000");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn render(axum::extract::State(state): axum::extract::State<SharedState>, tmpl: &'static str) -> Html<String> {
    let theme = state.read().await.theme.clone();
    Html(theme.render(tmpl))
}
