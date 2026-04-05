use crux_core::{
    Command,
    macros::effect,
    render::{self, RenderOperation},
};
use serde::{Deserialize, Serialize};

/// Events that the UI can send to the core
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum Event {
    None,
}

/// The application's state model
#[derive(Default)]
pub struct Model;

/// The view model sent to the UI for rendering
#[derive(Serialize, Deserialize, Clone, Default, Debug, PartialEq, Eq)]
pub struct ViewModel {
    pub text: String,
}

/// Effects the Core will request from the Shell
#[effect(typegen)]
pub enum Effect {
    Render(RenderOperation),
}

/// The main application
#[derive(Default)]
pub struct MindMap;

impl crux_core::App for MindMap {
    type Event = Event;
    type Model = Model;
    type ViewModel = ViewModel;
    type Effect = Effect;

    fn update(
        &self,
        _event: Self::Event,
        _model: &mut Self::Model,
    ) -> Command<Self::Effect, Self::Event> {
        render::render()
    }

    fn view(&self, _model: &Self::Model) -> Self::ViewModel {
        ViewModel {
            text: "My Little Mind Map".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crux_core::Core;

    #[test]
    fn renders_view() {
        let core: Core<MindMap> = Core::new();

        let effects = core.process_event(Event::None);
        assert_eq!(effects.len(), 1);

        let view = core.view();
        assert_eq!(view.text, "My Little Mind Map");
    }
}
