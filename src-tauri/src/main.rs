#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save, load])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn save(file: &str, file_name: &str) -> String {
    let path_str;
    if !file_name.ends_with(".vd"){
        path_str = format!("{}.vd", file_name);
    }else{
        path_str = format!("{}", file_name);
    }
    let path = Path::new(&path_str[..]);
    let display = path.display();

    // Open a file in write-only mode, returns `io::Result<File>`
    let mut f = match File::create(&path) {
        Err(_) => return format!("oops {}", path_str),
        Ok(f) => f,
    };

    match f.write_all(file.as_bytes()) {
        Err(why) => panic!("couldn't write to {}: {}", display, why),
        Ok(_) => println!("successfully wrote to {}", display),
    }

   return format!("returns, {}!", display);
}

#[tauri::command]
fn load(file_name: &str) -> String{
    // Create a path to the desired file
    let path_str;
    if !file_name.ends_with(".vd"){
        path_str = format!("{}.vd", file_name);
    }else{
        path_str = format!("{}", file_name);
    }
    let path = Path::new(&path_str[..]);
    let display = path.display();

    // Open the path in read-only mode, returns `io::Result<File>`
    let mut file = match File::open(&path) {
        Err(_) => return format!("oops {}", path_str),
        Ok(file) => file,
    };

    // Read the file contents into a string, returns `io::Result<usize>`
    let mut s = String::new();
    match file.read_to_string(&mut s) {
        Err(why) => panic!("couldn't read {}: {}", display, why),
        Ok(_) => print!("{} contains:\n{}", display, s),
    }

    return s;
}

