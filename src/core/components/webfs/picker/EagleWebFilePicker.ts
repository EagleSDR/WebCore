import IEagleContext from "../../../../../lib/core/IEagleContext";
import EagleUtil from "../../../../../lib/EagleUtil";
import { EagleDialogButtonType } from "../../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialogButton from "../../../../../lib/ui/dialog/button/IEagleDialogButton";
import IEagleDialog from "../../../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogBuilder from "../../../../../lib/ui/dialog/IEagleDialogBuilder";
import EagleDialogBuilder from "../../../../ui/dialog/builder/EagleDialogBuilder";
import EagleWebFileManager from "../../EagleWebFileManager";
import IWebFsCapacity from "../IWebFsCapacity";
import IWebFsDirectoryQuery from "../IWebFsDirectoryQuery";
import IWebFsDirectoryQueryDir from "../IWebFsDirectoryQueryDir";
import IWebFsDirectoryQueryFile from "../IWebFsDirectoryQueryFile";
require("./picker.css");

const FILE_FORMAT_LABEL_TABLE = ["KB", "MB", "GB", "TB"];

export default abstract class EagleWebFilePicker {

    constructor(manager: EagleWebFileManager, context: IEagleContext) {
        this.manager = manager;
        this.context = context;

        //Create builder
        this.builder = context.CreateDialogBuilder();

        //Create container
        this.nodeContainer = EagleUtil.CreateElement("div", "eagle_webfs_picker");
        this.builder.AddCustom(this.nodeContainer);

        //Add buttons
        this.btnConfirm = this.builder.AddButton(this.GetConfirmBtnText(), EagleDialogButtonType.POSITIVE, () => {
            this.btnConfirm.SetLoading(true);
            this.OnConfirm().then(() => {
                this.btnConfirm.SetLoading(false);
            });
        });
        this.btnCancel = this.builder.AddButton("Cancel", EagleDialogButtonType.NEUTRAL, () => {
            this.OnCancel();
        });

        //Create the header
        var header = EagleUtil.CreateElement("div", "eagle_webfs_picker_title", this.nodeContainer);
        this.nodeTitle = EagleUtil.CreateElement("div", null, header);
        var storageContainer = EagleUtil.CreateElement("div", "eagle_webfs_picker_header_storage", header);
        this.storageUse = EagleUtil.CreateElement("div", "eagle_webfs_picker_header_storage_bar", storageContainer);

        //Create the path header
        this.groupPath = EagleUtil.CreateElement("div", "eagle_webfs_picker_paths", this.nodeContainer);

        //Create the content
        this.nodeContent = EagleUtil.CreateElement("div", "eagle_webfs_picker_content", this.nodeContainer);

        //Create the footer
        var footer = EagleUtil.CreateElement("div", "eagle_webfs_picker_footer", this.nodeContainer);
        this.nodeFilename = EagleUtil.CreateElement("input", "eagle_webfs_picker_footer_filename", footer) as HTMLInputElement;
        this.nodeFilename.type = "text";
        this.nodeType = EagleUtil.CreateElement("select", "eagle_webfs_picker_footer_type", footer) as HTMLSelectElement;

        //Add event to add the desired filename when the user is done editing the box
        this.nodeFilename.addEventListener('change', () => this.nodeFilename.value = this.CorrectFileName());

        //Add event to send update events to the user
        this.nodeFilename.addEventListener('input', () => this.OnFileNameChanged(this.GetFileName()));

        //Add event to fire when changing the filtered extension
        this.nodeType.addEventListener("input", () => {
            this.UpdateContent();
            this.nodeFilename.value = this.CorrectFileName();
        });

        //Request the capacity
        this.manager.QueryQuota().then((info: IWebFsCapacity) => {
            this.storageUse.style.width = ((1 - (info.free / info.capacity)) * 100) + "%";
        });

        //Load the default path
        this.ChangeDirectory("/");
    }

    private manager: EagleWebFileManager;
    private context: IEagleContext;
    private builder: IEagleDialogBuilder;
    private dialog: IEagleDialog;

    private btnConfirm: IEagleDialogButton;
    private btnCancel: IEagleDialogButton;

    private storageUse: HTMLElement;

    private groupBtns: HTMLElement;
    private groupPath: HTMLElement;

    private nodeContainer: HTMLElement;
    private nodeTitle: HTMLElement;
    private nodeContent: HTMLElement;
    private nodeFilename: HTMLInputElement;
    private nodeType: HTMLSelectElement;

    private selectedElement: HTMLElement;
    private latestData: IWebFsDirectoryQuery;
    private isLoading: boolean = false;

    private AddPathItem(name: string, isHome: boolean, url: string, callback: (url: string) => void) {
        //Add the divider
        if (!isHome)
            EagleUtil.CreateElement("div", "eagle_webfs_picker_header_path_item_divider", this.groupPath);

        //Create
        var e = EagleUtil.CreateElement("div", "eagle_webfs_picker_header_path_item", this.groupPath);
        if (isHome)
            e.classList.add("eagle_webfs_picker_header_path_item_home");
        EagleUtil.CreateElement("div", "eagle_webfs_picker_header_path_item_text", e).innerText = name;

        //Bind
        e.addEventListener("click", (evt: Event) => {
            callback(url);
            evt.preventDefault();
        });
        e.addEventListener("mousedown", (evt: Event) => {
            evt.preventDefault();
        });
    }

    private AddEntry<T>(icon: string, name: string, date: Date, size: number, data: T, onSelect: (data: T, node: HTMLElement) => void, onChoose: (data: T, node: HTMLElement) => void) {
        //Create
        var e = EagleUtil.CreateElement("div", "eagle_webfs_picker_content_item", this.nodeContent);
        var nIcon = EagleUtil.CreateElement("div", "eagle_webfs_picker_content_item_icon", e);
        var nName = EagleUtil.CreateElement("div", "eagle_webfs_picker_content_item_name", e);
        var nDate = EagleUtil.CreateElement("div", "eagle_webfs_picker_content_item_date", e);
        var nSize = EagleUtil.CreateElement("div", "eagle_webfs_picker_content_item_size", e);

        //Configure
        nIcon.classList.add(icon);
        nName.innerText = name;
        nDate.innerText = EagleWebFilePicker.FormatDay(date.getFullYear(), date.getMonth() + 1, date.getDay()) + " " + EagleWebFilePicker.FormatTime(date.getHours(), date.getMinutes());
        nSize.innerText = size == -1 ? "" : EagleWebFilePicker.FormatSize(size);

        //Add events
        e.addEventListener("click", (evt: Event) => {
            onSelect(data, e);
            evt.preventDefault();
        });
        e.addEventListener("dblclick", (evt: Event) => {
            onChoose(data, e);
            evt.preventDefault();
        });
        e.addEventListener("mousedown", (evt: Event) => {
            evt.preventDefault();
        });
    }

    private LoadingContent() {
        //Clear content
        EagleUtil.RemoveElementChildren(this.nodeContent);
        this.selectedElement = null;

        //Add loading screen
        this.nodeContent.classList.add("eagle_webfs_picker_content_loading");
    }

    private UpdateContent() {
        //If loading, ignore. We'll be called soon enough...
        if (this.isLoading || this.latestData == null)
            return;

        //Clear path
        EagleUtil.RemoveElementChildren(this.groupPath);
        var url = "/";
        this.AddPathItem("", true, url, (dir: string) => this.ChangeDirectory(dir));
        for (var i = 0; i < this.latestData.path.length; i++) {
            url += this.latestData.path[i] + "/";
            this.AddPathItem(this.latestData.path[i], false, url, (dir: string) => this.ChangeDirectory(dir));
        }

        //Clear content
        EagleUtil.RemoveElementChildren(this.nodeContent);
        this.selectedElement = null;

        //Remove loading screen
        this.nodeContent.classList.remove("eagle_webfs_picker_content_loading");

        //Get data
        var data = this.latestData;
        var filter = this.nodeType.value.toLowerCase();

        //Add each subdirectory
        for (var i = 0; i < data.subdirectories.length; i++)
            this.AddEntry("eagle_webfs_picker_icon_folder", data.subdirectories[i].name, new Date(data.subdirectories[i].last_modified), -1, data.subdirectories[i],
                (data: IWebFsDirectoryQueryDir, node: HTMLElement) => {
                    this.ChangeSelectedElement(node);
                },
                (data: IWebFsDirectoryQueryDir, node: HTMLElement) => {
                    this.ChangeDirectory(this.GetCurrentPath() + data.name);
                }
            );

        //Add each file
        for (var i = 0; i < data.files.length; i++) {
            //Check if a filter should remove this
            if (filter != '*' && EagleWebFilePicker.SplitFileName(data.files[i].name).extension.toLowerCase() != filter)
                continue;

            //Add
            this.AddEntry(EagleWebFilePicker.GetFileIcon(data.files[i].name), data.files[i].name, new Date(data.files[i].last_modified), data.files[i].size, data.files[i],
                (data: IWebFsDirectoryQueryFile, node: HTMLElement) => {
                    this.ChangeSelectedElement(node);
                    this.OnFileHighlighted(data);
                },
                (data: IWebFsDirectoryQueryFile, node: HTMLElement) => {
                    this.OnFileChosen(data);
                }
            );
        }
            
    }

    private async ChangeDirectory(path: string): Promise<void> {
        //Make loading
        this.LoadingContent();

        //Fetch
        this.isLoading = true;
        var data = await this.manager.QueryDirectory(path);

        //Display
        this.isLoading = false;
        this.latestData = data;
        this.UpdateContent();
    }

    private ChangeSelectedElement(element: HTMLElement) {
        //Remove from old selection
        if (this.selectedElement != null)
            this.selectedElement.classList.remove("eagle_webfs_picker_content_item_selected");

        //Set
        this.selectedElement = element;
        if (this.selectedElement != null)
            this.selectedElement.classList.add("eagle_webfs_picker_content_item_selected");
    }

    private GetCurrentPath(): string {
        var path = "/";
        for (var i = 0; i < this.latestData.path.length; i++)
            path += this.latestData.path[i] + "/";
        return path;
    }

    // Corrects the file name entered in the box to make sure it includes the selected file extension
    private CorrectFileName(): string {
        return this.CorrectFileNameUtil(this.nodeFilename.value);
    }

    // Corrects any file name entered to include the selected extension
    private CorrectFileNameUtil(name: string): string {
        //Split into pieces
        var parts = EagleWebFilePicker.SplitFileName(name);

        //If the extension is set to '*', it means the file can have any type. If that's not the case, enforce the selection
        if (this.nodeType.value != '*')
            parts.extension = this.nodeType.value;

        //Reform
        return parts.name + (parts.extension.length > 0 ? "." : "") + parts.extension;
    }

    /* PROTECTED API */

    protected GetManager(): EagleWebFileManager {
        return this.manager;
    }

    protected GetDialog(): IEagleDialog {
        return this.dialog;
    }

    protected GetContext(): IEagleContext {
        return this.context;
    }

    protected AddFileType(description: string, extension: string) {
        var option = document.createElement('option');
        option.value = extension;
        option.innerText = description + " (*." + extension + ")";
        this.nodeType.appendChild(option);
    }

    protected AddHeaderButton(text: string, classname: string, onClick: () => void) {
        var e = EagleUtil.CreateElement("div", "eagle_webfs_picker_header_btn", this.groupBtns);
        e.classList.add(classname);
        e.addEventListener("click", (evt: Event) => {
            onClick();
            evt.preventDefault();
        });
    }

    protected SetFileName(name: string) {
        this.nodeFilename.value = this.CorrectFileNameUtil(name);
        this.OnFileNameChanged(name);
    }

    protected GetFileName(): string {
        return this.CorrectFileName();
    }

    protected GetFilePath(): string {
        return this.GetCurrentPath() + this.GetFileName();
    }

    protected GetFileExists(): boolean {
        var exists = false;
        for (var i = 0; i < this.latestData.files.length; i++)
            exists = exists || this.latestData.files[i].name == this.GetFileName();
        return exists;
    }

    protected SetDialogTitle(text: string) {
        this.nodeTitle.innerText = text;
    }

    protected SetConfirmButtonEnabled(enabled: boolean) {
        if (enabled)
            this.btnConfirm.Enable();
        else
            this.btnConfirm.Disable();
    }

    protected ShowDialog(): void {
        this.dialog = this.builder.Show();
    }

    protected CloseDialog(): void {
        this.dialog.Remove();
    }

    /* ABSTRACT */

    protected abstract GetConfirmBtnText(): string;

    protected abstract OnFileHighlighted(file: IWebFsDirectoryQueryFile): void; // File selected with single click
    protected abstract OnFileChosen(file: IWebFsDirectoryQueryFile): void;      // File selected with double click
    protected abstract OnFileNameChanged(name: string): void;                   // File name box changed
    protected abstract OnConfirm(): Promise<void>;                              // "Confirm" button pressed
    protected abstract OnCancel(): void;                                        // "Cancel" button pressed

    /* UTIL */

    protected static IsFileNameEmpty(name: string): boolean {
        return EagleWebFilePicker.SplitFileName(name).name.length == 0;
    }

    private static GetFileIcon(name: string): string {
        //Get just the extension
        var parts = name.split('.');
        var ext = parts[parts.length - 1].toLowerCase();

        //Check types
        switch (ext) {
            case "cs":
            case "c":
            case "cpp":
            case "h":
            case "py":
            case "html":
            case "css":
            case "js":
            case "ts":
                return "eagle_webfs_picker_icon_code";
            case "png":
            case "jpg":
            case "jpeg":
            case "bmp":
            case "mp4":
            case "ts":
            case "mov":
            case "mpeg":
                return "eagle_webfs_picker_icon_image";
            case "wav":
                return "eagle_webfs_picker_icon_iq";
            case "txt":
            case "doc":
            case "docx":
                return "eagle_webfs_picker_icon_text";
            default:
                return "eagle_webfs_picker_icon_file";
        }
    }

    private static FormatSize(size: number): string {
        //Find size
        var formatIndex = 0;
        while (size > 1024) {
            size /= 1024;
            formatIndex++;
        }

        //Round to two decimals
        var sizeFormatted = (Math.round(size * 100) / 100).toFixed(2);

        return sizeFormatted + " " + FILE_FORMAT_LABEL_TABLE[formatIndex];
    }

    private static FormatTime(hours: number, minutes: number): string {
        if (hours == 0) {
            return "12:" + EagleWebFilePicker.PadNumber(minutes, 2) + " AM";
        } else if (hours <= 12) {
            return hours.toString() + ":" + EagleWebFilePicker.PadNumber(minutes, 2) + " " + (hours == 12 ? "PM" : "AM");
        } else {
            return (hours - 12).toString() + ":" + EagleWebFilePicker.PadNumber(minutes, 2) + " PM";
        }
    }

    private static FormatDay(year: number, month: number, day: number): string {
        return month.toString() + "/" + day.toString() + "/" + EagleWebFilePicker.PadNumber(year, 4);
    }

    private static PadNumber(num: number, len: number): string {
        var t = num.toString();
        while (t.length < len)
            t = "0" + t;
        return t;
    }

    private static SplitFileName(name: string): IFileName {
        //Find the last period
        var period = name.lastIndexOf('.');
        if (period == -1 || name.endsWith('.')) {
            //No extension!
            return {
                name: name,
                extension: ""
            };
        } else {
            //Get the parts
            return {
                name: name.substr(0, period),
                extension: name.substr(period + 1)
            };
        }
    }

}

interface IFileName {

    name: string;
    extension: string;

}