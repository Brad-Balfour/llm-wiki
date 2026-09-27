"""Return one prepared v4 playback string for a Voice navigation command."""


def select_playback(main, action, current_position=0, target_position=None):
    items = main["items"]
    if action == "begin":
        return main["sweep_playback"]
    if action == "repeat":
        position = current_position
    elif action == "next":
        position = current_position + 1
    elif action == "previous":
        position = max(0, current_position - 1)
    elif action == "jump":
        position = target_position
        if type(position) is not int or not 1 <= position <= len(items):
            raise ValueError("position outside queue")
    else:
        raise ValueError("unknown playback action")

    if position == 0:
        return main["sweep_playback"]
    if action == "next" and position == len(items) + 1:
        return "Finished."
    if type(position) is not int or not 1 <= position <= len(items):
        raise ValueError("position outside queue")
    return items[position - 1]["item_playback"]
