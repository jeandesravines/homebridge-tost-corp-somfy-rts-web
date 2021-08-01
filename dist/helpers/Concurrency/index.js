"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function concurrency() {
    let mutex = null;
    return (handler) => {
        if (!mutex) {
            mutex = Promise.resolve()
                .then(() => handler())
                .then(() => {
                mutex = null;
            });
        }
        return mutex;
    };
}
exports.default = concurrency;
//# sourceMappingURL=index.js.map