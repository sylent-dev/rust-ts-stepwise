//! What each built-in function does when a program calls it (see *Built-in functions* in
//! `specs.md`): the one door between the language and the world of the robot.

use std::borrow::Cow;

use super::error::RuntimeErrorKind;
use super::event::{Action, Event};
use super::value::{MAX_TEXT_LENGTH, Value};
use crate::builtin::Builtin;
use crate::color::Color;
use crate::world::{Side, World};

/// What a call of a built-in function did. It is one or the other, never both: what gives
/// back no value is the only thing a step shows, which is why a step reports at most one
/// event.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum Effect {
    /// An action of the robot, or `print`: what the learner sees of it. It gives back no
    /// value.
    Acted(Event),
    /// A sensor: the boolean it gives back. The learner sees nothing of it.
    Sensed(bool),
}

/// Calls `builtin` with `values`, the ones of the call in order, on `world`.
///
/// # Errors
///
/// [`RuntimeErrorKind::Robot`] when the robot can't do the action,
/// [`RuntimeErrorKind::ValueNotColor`] when a function that takes a color is given another
/// value, [`RuntimeErrorKind::LineTooLong`] when `print` is given more than a line holds, and
/// [`RuntimeErrorKind::Internal`] for a wrong number of values, which the checks before
/// running rule out. The world then stays as it was, and nothing is written.
pub(super) fn call(
    builtin: Builtin,
    values: &[Value],
    world: &mut World,
) -> Result<Effect, RuntimeErrorKind> {
    let expected = builtin.parameter_count();
    if expected.is_some_and(|count| count != values.len()) {
        return Err(RuntimeErrorKind::Internal);
    }
    // Every function is listed, so that a new one can't be forgotten, and each arm says
    // whether it acts or senses.
    Ok(match builtin {
        Builtin::Forward => {
            world.forward()?;
            acted(Action::Moved)
        }
        Builtin::TurnLeft => {
            world.turn_left();
            acted(Action::TurnedLeft)
        }
        Builtin::TurnRight => {
            world.turn_right();
            acted(Action::TurnedRight)
        }
        Builtin::StartPainting => {
            world.start_painting(color(builtin, values)?);
            acted(Action::StartedPainting)
        }
        Builtin::StopPainting => {
            world.stop_painting();
            acted(Action::StoppedPainting)
        }
        Builtin::StartErasing => {
            world.start_erasing();
            acted(Action::StartedErasing)
        }
        Builtin::StopErasing => {
            world.stop_erasing();
            acted(Action::StoppedErasing)
        }
        Builtin::PickUp => {
            world.pick_up()?;
            acted(Action::PickedUp)
        }
        Builtin::Drop => {
            world.drop_item()?;
            acted(Action::Dropped)
        }
        Builtin::FrontIsClear => Effect::Sensed(world.is_clear(Side::Front)),
        Builtin::LeftIsClear => Effect::Sensed(world.is_clear(Side::Left)),
        Builtin::RightIsClear => Effect::Sensed(world.is_clear(Side::Right)),
        Builtin::HereIs => Effect::Sensed(world.paint_here() == Some(color(builtin, values)?)),
        Builtin::FrontIs => Effect::Sensed(is_painted(world, Side::Front, builtin, values)?),
        Builtin::LeftIs => Effect::Sensed(is_painted(world, Side::Left, builtin, values)?),
        Builtin::RightIs => Effect::Sensed(is_painted(world, Side::Right, builtin, values)?),
        Builtin::ItemHere => Effect::Sensed(world.item_here()),
        Builtin::ItemInFront => Effect::Sensed(world.item_in_front()),
        Builtin::IsCarrying => Effect::Sensed(world.is_carrying()),
        Builtin::IsPainting => Effect::Sensed(world.is_painting()),
        Builtin::IsErasing => Effect::Sensed(world.is_erasing()),
        Builtin::Print => Effect::Acted(Event::Printed(printed_line(values)?)),
    })
}

/// What an action of the robot that went well did.
const fn acted(action: Action) -> Effect {
    Effect::Acted(Event::Robot(action))
}

/// `front_is(color)`, `left_is(color)` and `right_is(color)`: whether the cell on `side` has
/// the paint the call gives `function`.
fn is_painted(
    world: &World,
    side: Side,
    function: Builtin,
    values: &[Value],
) -> Result<bool, RuntimeErrorKind> {
    Ok(world.paint_toward(side) == Some(color(function, values)?))
}

/// The color a call gives `function`, its one value.
fn color(function: Builtin, values: &[Value]) -> Result<Color, RuntimeErrorKind> {
    match values {
        [Value::Color(color)] => Ok(*color),
        [other] => {
            let found = other.value_type();
            Err(RuntimeErrorKind::ValueNotColor { function, found })
        }
        _ => Err(RuntimeErrorKind::Internal),
    }
}

/// The line `print` writes for `values`: each as it is written, separated by spaces.
///
/// # Errors
///
/// [`RuntimeErrorKind::LineTooLong`] for a line of more than [`MAX_TEXT_LENGTH`] characters.
/// Each value is measured before it is copied, so that a line too long is given up without
/// being built: many long texts printed at once take no memory.
fn printed_line(values: &[Value]) -> Result<String, RuntimeErrorKind> {
    let mut line = String::new();
    // The characters the line may still take.
    let mut room = MAX_TEXT_LENGTH;
    for (index, value) in values.iter().enumerate() {
        let separator = if index == 0 { "" } else { " " };
        // A text is read where it is; the other values are a few characters each.
        let written = match value {
            Value::Text(text) => Cow::Borrowed(&**text),
            other => Cow::Owned(other.to_string()),
        };
        for part in [separator, &*written] {
            // Counted no further than the room left, however long a text is.
            let characters = part.chars().take(room.saturating_add(1)).count();
            room = room
                .checked_sub(characters)
                .ok_or(RuntimeErrorKind::LineTooLong)?;
            line.push_str(part);
        }
    }
    Ok(line)
}
