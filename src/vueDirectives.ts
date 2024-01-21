import { ref } from "vue";

interface IResizeElement extends HTMLElement {
    _handleResize: () => void;
}

interface IClickOutsideElement extends HTMLElement {
    clickOutsideEvent: (event: any) => void;
}

const vResize = {
    beforeMount(el: IResizeElement, binding: any) {
        const width = ref(el.clientWidth);
        const height = ref(el.clientHeight);

        const handleResize = () => {
            width.value = el.clientWidth;
            height.value = el.clientHeight;

            if (typeof binding.value === "function") {
                binding.value(width.value, height.value);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        el._handleResize = handleResize;
    },
    unmounted(el: IResizeElement) {
        window.removeEventListener("resize", el._handleResize);
    },
};

const vClickOutside = {
    beforeMount(el: IClickOutsideElement, binding: any) {
        el.clickOutsideEvent = (event: any) => {
            if (!(el === event.target || el.contains(event.target))) {
                if (typeof binding.value === "function") {
                    binding.value(event, el);
                }
            }
        };

        document.body.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted(el: any) {
        document.body.removeEventListener("click", el.clickOutsideEvent);
    },
};

export { vResize, vClickOutside };
