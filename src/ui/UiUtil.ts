export default class UiUtil {

    static WaitForWindowLayout(element: HTMLElement): Promise<void> {
        return new Promise((resolve, reject) => {
            UiUtil.WaitForWindowLayoutHelper(element, resolve);
        });
    }

    private static WaitForWindowLayoutHelper(element: HTMLElement, resolve: () => void): void {
        requestAnimationFrame(() => {
            if (element.clientWidth == 0 && element.clientHeight == 0)
                UiUtil.WaitForWindowLayoutHelper(element, resolve);
            else
                resolve();
        });
    }

}