import SwiftUI

@main
struct MindMapApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        VStack {
            Text("My Little Mind Map")
                .font(.largeTitle)
            Text("iOS app ready. CRUX integration pending.")
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
