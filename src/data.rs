use crate::theme::Theme;

pub struct AppState {
    pub theme:             Theme,
    pub sevens_api_url:    String,
    pub sevens_tournament: Option<serde_json::Value>,
    pub sevens_schedule:   Vec<serde_json::Value>,
    pub sevens_pools:      Vec<serde_json::Value>,
}

impl AppState {
    pub fn new(theme: Theme) -> Self {
        Self {
            theme,
            sevens_api_url:    String::new(),
            sevens_tournament: None,
            sevens_schedule:   Vec::new(),
            sevens_pools:      Vec::new(),
        }
    }
}
