import { scroller } from "./state";
import { bootstrap } from "./ui";
import { showFrame } from "./frames";

scroller
    .setup({ step: ".step", offset: 0.5, progress: true })
    .onStepEnter((response: any) => {
        const stepNum = Number(response.element.dataset.step);
        showFrame(stepNum);
    });

window.addEventListener("resize", () => {
    scroller.resize();
});

bootstrap();
showFrame(1);