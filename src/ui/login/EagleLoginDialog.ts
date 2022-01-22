import EagleUtil from "../../../lib/EagleUtil";
import { EagleDialogButtonType } from "../../../lib/ui/dialog/button/EagleDialogButtonType";
import EagleApp from "../../EagleApp";
require("./login.css");

export default function PromptLoginDialog(app: EagleApp, container: HTMLElement): Promise<string> {
    return new Promise<string>((resolve) => {
        //Set up dialog
        var node = EagleUtil.CreateElement("div", "eagle_login_container", container);
        var content = EagleUtil.CreateElement("div", "eagle_login_content", node);
        var inputUsername = CreateFormItem(content, "Username", "text");
        var inputPassword = CreateFormItem(content, "Password", "password");
        var loginBtn = EagleUtil.CreateElement("div", 'eagle_login_confirm', content);
        loginBtn.innerText = "Login";

        //Create the main event
        var loading = false;
        var loginCb = async () => {
            //Block
            if (loading)
                return;

            //Make loading
            loading = true;
            node.classList.add("eagle_login_loading");

            //Send request
            var response = await EagleUtil.HttpPostRequestJson(app.CreateUrl(false, "/api/login", {}), {
                "username": inputUsername.value,
                "password": inputPassword.value
            });

            //Check if it was successful or not
            if (response["success"]) {
                //Successful! Return the token
                resolve(response["token"]);

                //Start hiding animation
                node.classList.add("eagle_login_closing");

                //Delete the login container after the animation finishes
                setTimeout(() => node.remove(), 500);
            } else {
                //Invalid password. Show dialog
                await app.GetDialogManager().ShowAlertDialog("Can't Login", "Incorrect username or password. Please try again.", "Okay", EagleDialogButtonType.POSITIVE);

                //Stop loading
                loading = false;
                node.classList.remove("eagle_login_loading");
            }
        };

        //Add events
        loginBtn.addEventListener("click", (evt: MouseEvent) => { evt.preventDefault(); loginCb(); });
        inputUsername.addEventListener("keydown", (evt: KeyboardEvent) => { if (evt.keyCode == 13) { evt.preventDefault(); loginCb(); } });
        inputPassword.addEventListener("keydown", (evt: KeyboardEvent) => { if (evt.keyCode == 13) { evt.preventDefault(); loginCb(); } });
    });
}

function CreateFormItem(container: HTMLElement, title: string, type: string): HTMLInputElement {
    EagleUtil.CreateElement("div", "eagle_login_form_title", container).innerText = title;
    var input = EagleUtil.CreateElement("input", "eagle_login_form_input", container) as HTMLInputElement;
    input.type = type;
    return input;
}