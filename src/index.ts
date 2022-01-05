import EagleApp from "./EagleApp";

var app = new EagleApp(document.body, "");
(document as any).app = app;
app.Init();