use keyring::Credential;

const KEYRING_SERVICE: &str = "com.equiptracker.app";
const KEYRING_ACCOUNT: &str = "auth-token";

fn token_stores() -> Vec<Box<Credential>> {
  let mut stores = Vec::new();
  if let Ok(store) =
    keyring::default::default_credential_builder().build(None, KEYRING_SERVICE, KEYRING_ACCOUNT)
  {
    stores.push(store);
  }
  // En Linux sin Secret Service, el keyring del kernel guarda la sesión hasta cerrar sesión.
  #[cfg(target_os = "linux")]
  if let Ok(store) =
    keyring::keyutils::default_credential_builder().build(None, KEYRING_SERVICE, KEYRING_ACCOUNT)
  {
    stores.push(store);
  }
  stores
}

#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
  let mut saved = false;
  let mut last_error = None;
  for store in token_stores() {
    match store.set_password(&token) {
      Ok(()) => saved = true,
      Err(e) => last_error = Some(e),
    }
  }
  if saved {
    Ok(())
  } else {
    Err(last_error
      .map(|e| e.to_string())
      .unwrap_or_else(|| "No hay almacén de credenciales disponible".into()))
  }
}

#[tauri::command]
fn load_token() -> Result<Option<String>, String> {
  for store in token_stores() {
    if let Ok(token) = store.get_password() {
      return Ok(Some(token));
    }
  }
  Ok(None)
}

#[tauri::command]
fn delete_token() -> Result<(), String> {
  for store in token_stores() {
    let _ = store.delete_credential();
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_token, load_token, delete_token])
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_http::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
