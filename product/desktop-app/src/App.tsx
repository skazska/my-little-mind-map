import "./App.css";
import { useApp } from "./useApp";
import { FirstLaunchScreen } from "./screens/FirstLaunchScreen";
import { OverviewScreen } from "./screens/OverviewScreen";
import { NoteListScreen } from "./screens/NoteListScreen";
import { NoteEditorScreen } from "./screens/NoteEditorScreen";

function App() {
  const { viewModel, dispatch } = useApp();

  switch (viewModel.screen) {
    case "loading":
      return <div className="screen loading"><p>Loading…</p></div>;

    case "first_launch":
      return <FirstLaunchScreen dispatch={dispatch} />;

    case "overview":
      return (
        <OverviewScreen
          activeTab={viewModel.active_tab}
          spaces={viewModel.spaces}
          labels={viewModel.labels}
          searchQuery={viewModel.search_query}
          dataFolder={viewModel.data_folder}
          error={viewModel.error}
          dispatch={dispatch}
        />
      );

    case "note_list":
      return (
        <NoteListScreen
          spaceId={viewModel.space_id}
          spaceName={viewModel.space_name}
          notes={viewModel.notes}
          searchQuery={viewModel.search_query}
          activeViewLabels={viewModel.active_view_labels}
          error={viewModel.error}
          dispatch={dispatch}
        />
      );

    case "note_editor":
      return (
        <NoteEditorScreen
          id={viewModel.id}
          title={viewModel.title}
          content={viewModel.content}
          labels={viewModel.labels}
          spaceId={viewModel.space_id}
          draft={viewModel.draft}
          uuid={viewModel.uuid}
          created_at={viewModel.created_at}
          updated_at={viewModel.updated_at}
          error={viewModel.error}
          dispatch={dispatch}
        />
      );

    case "error":
      return (
        <div className="screen error-screen" data-screen="error">
          <h2>Something went wrong</h2>
          <p>{viewModel.message}</p>
          <button
            className="btn btn--primary"
            data-testid="go-home-btn"
            onClick={() => dispatch({ type: "navigate_overview", tab: "spaces" })}
          >
            Go home
          </button>
        </div>
      );
  }
}

export default App;
