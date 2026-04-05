# Mobile Apps

Placeholder shells for iOS and Android. These will integrate with the CRUX shared core via UniFFI bindings.

## iOS (Swift + SwiftUI)

The `ios/` folder contains a minimal SwiftUI app scaffold.
Full Xcode project setup will be done when iOS development begins.

### Prerequisites

- Xcode (macOS only)
- `cargo install uniffi-bindgen-swift` (UniFFI Swift bindings generator)
- Rust target: `rustup target add aarch64-apple-ios`

## Android (Kotlin + Jetpack Compose)

The `android/` folder contains a minimal Gradle + Kotlin/Compose scaffold.

### Prerequisites

- Android Studio
- `cargo install uniffi-bindgen-java` (UniFFI Java/Kotlin bindings generator)
- Rust targets: `rustup target add aarch64-linux-android armv7-linux-androideabi`
