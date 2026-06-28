// Branding for this deployment, read entirely from the environment.
// Spinning up the next event's site is: copy this folder, set a new
// SEVENS_API_URL + TOURNAMENT_*/THEME_* env vars and logo, redeploy.
// No Rust or template changes required.

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

#[derive(Clone)]
pub struct Theme {
    pub tournament_name: String,
    pub host_name:        String,
    pub venue:             String,
    pub logo_url:          String,
    pub color_primary:    String, // red
    pub color_dark:       String, // black
    pub color_light:      String, // white
    pub color_accent:     String, // light leaf green
    pub qualify_top_n:    String, // top N per pool that advance to the Cup
}

impl Theme {
    pub fn from_env() -> Self {
        Self {
            tournament_name: env_or("TOURNAMENT_NAME", "Juja 7s"),
            host_name:        env_or("HOST_NAME", "JKUAT Cougars"),
            venue:             env_or("TOURNAMENT_VENUE", "JKUAT Main Campus, Juja"),
            logo_url:          env_or("THEME_LOGO_URL", "/img/logo.jpg"),
            color_primary:    env_or("THEME_PRIMARY", "#C8102E"),
            color_dark:       env_or("THEME_DARK", "#111111"),
            color_light:      env_or("THEME_LIGHT", "#ffffff"),
            color_accent:     env_or("THEME_ACCENT", "#8BC34A"),
            qualify_top_n:    env_or("POOL_QUALIFY_TOP_N", "2"),
        }
    }

    /// Replace `{{PLACEHOLDER}}` tokens in a template with this theme's values.
    pub fn render(&self, template: &str) -> String {
        template
            .replace("{{TOURNAMENT_NAME}}", &self.tournament_name)
            .replace("{{HOST_NAME}}", &self.host_name)
            .replace("{{VENUE}}", &self.venue)
            .replace("{{LOGO_URL}}", &self.logo_url)
            .replace("{{COLOR_PRIMARY}}", &self.color_primary)
            .replace("{{COLOR_DARK}}", &self.color_dark)
            .replace("{{COLOR_LIGHT}}", &self.color_light)
            .replace("{{COLOR_ACCENT}}", &self.color_accent)
            .replace("{{QUALIFY_TOP_N}}", &self.qualify_top_n)
    }
}
