import IEagleProperty from "../../../../../lib/core/port/IEagleProperty";
import IEagleRadioSession from "../../../../../lib/core/radio/IEagleRadioSession";
import EagleUtil from "../../../../../lib/EagleUtil";
import EagleApp from "../../../../EagleApp";
require("./style.css");

const DIGITS_DISPLAYED = 12;
const DIGITS_PER_GROUP = 3;

export default function EagleCreateFreqControl(app: EagleApp, container: HTMLElement) {
    //Create container
    var node = EagleUtil.CreateElement("div", "eagle_core_header_freq_container", container);

    //Get the property
    var session = app.GetRadio().GetSession();
    var prop = session.FrequencyAbsolute();

    //Create each digit
    var mainSegment = EagleUtil.CreateElement("div", "eagle_core_header_freq_segment", node);
    for (var i = DIGITS_DISPLAYED; i > 0; i--) {
        //Calculate value
        var value = Math.pow(10, i - 1);

        //Check if this needs to have a divider inserted
        if (i % DIGITS_PER_GROUP == 0 && i != DIGITS_DISPLAYED)
            mainSegment.appendChild(CreateDivider(prop, value * 10));

        //Create the number
        mainSegment.appendChild(CreateNumber(prop, value));
    }

    //Add the lock/unlock button
    node.appendChild(CreateVfoLockButton(session.VfoLocked()));
}

function CreateVfoLockButton(prop: IEagleProperty<boolean>): HTMLElement {
    //Create
    var btn = EagleUtil.CreateElement("div", "eagle_core_header_freq_segment");
    btn.classList.add("eagle_core_header_freq_vfolock");

    //Bind to clicks
    btn.addEventListener("click", (evt: MouseEvent) => {
        prop.SetValue(!prop.GetValue());
        evt.preventDefault();
        evt.stopPropagation();
    });

    //Bind to changes
    prop.OnUpdated.Bind({
        HandleEvent: (locked: boolean) => UpdateVfoLockButton(locked, btn)
    });

    //Set
    UpdateVfoLockButton(prop.GetValue(), btn);

    return btn;
}

function UpdateVfoLockButton(value: boolean, node: HTMLElement) {
    if (value)
        node.classList.add("eagle_core_header_freq_vfolock_locked");
    else
        node.classList.remove("eagle_core_header_freq_vfolock_locked");
}

function CreateDivider(prop: IEagleProperty<number>, value: number): HTMLElement {
    //Create container digit, setting it to be just a period
    var container = EagleUtil.CreateElement("div", "eagle_core_header_freq_item");
    container.classList.add("eagle_core_header_freq_item_narrow");
    var digit = EagleUtil.CreateElement("div", "eagle_core_header_freq_digit", container);
    digit.classList.add("eagle_core_header_freq_digit_dark");
    digit.innerText = ".";

    //Add change event
    prop.OnUpdated.Bind({
        HandleEvent: (freq: number) => {
            UpdateDigit(value, prop.GetValue(), digit, false);
        }
    });

    //Set to current value
    UpdateDigit(value, prop.GetValue(), digit, false);

    return container;
}

function CreateNumber(prop: IEagleProperty<number>, value: number): HTMLElement {
    //Create each component
    var container = EagleUtil.CreateElement("div", "eagle_core_header_freq_item");
    var digit = EagleUtil.CreateElement("div", "eagle_core_header_freq_digit", container);
    var flapTop = EagleUtil.CreateElement("div", "eagle_core_header_freq_flap_top", container);
    var flapBottom = EagleUtil.CreateElement("div", "eagle_core_header_freq_flap_bottom", container);

    //Add events to flaps
    AddFlapEvent(prop, value, flapTop);
    AddFlapEvent(prop, -value, flapBottom);

    //Add event to scroll wheel
    container.addEventListener("wheel", (evt: WheelEvent) => {
        UpdateFreq(prop, value * (evt.deltaY >= 0 ? -1 : 1));
        evt.preventDefault();
        evt.stopPropagation();
    });

    //Add change event
    prop.OnUpdated.Bind({
        HandleEvent: (freq: number) => {
            UpdateDigit(value, prop.GetValue(), digit, true);
        }
    });

    //Set to current value
    UpdateDigit(value, prop.GetValue(), digit, true);

    return container;
}

function AddFlapEvent(prop: IEagleProperty<number>, value: number, node: HTMLElement) {
    node.addEventListener("click", (evt: MouseEvent) => {
        UpdateFreq(prop, value);
        evt.preventDefault();
        evt.stopPropagation();
    });
}

function UpdateFreq(prop: IEagleProperty<number>, add: number) {
    var value = prop.GetValue() + add;
    if (value >= Math.pow(10, DIGITS_DISPLAYED))
        value = Math.pow(10, DIGITS_DISPLAYED) - 1;
    if (value < 0)
        value = 0;
    prop.SetValue(value);
}

function UpdateDigit(value: number, freq: number, digit: HTMLElement, updateText: boolean) {
    //Contrain
    freq = Math.max(freq, 0);

    //Update text
    if (updateText)
        digit.innerText = (Math.floor(freq / value) % 10).toString();

    //Determine if this number should be dark or not
    if ((freq / value) >= 1)
        digit.classList.remove("eagle_core_header_freq_digit_dark");
    else
        digit.classList.add("eagle_core_header_freq_digit_dark");
}