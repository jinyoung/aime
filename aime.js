const handler = {
    get(target, propKey, receiver) {
        let origMethod = target[propKey];

        let async = false;
        if (!origMethod && propKey.startsWith('a') && target[propKey.substring(1)]) {
            origMethod = target[propKey.substring(1)];
            async = true;
        }
        
        return function(...args) {
            // 공통 로직을 처리하는 함수
            const processResult = (method, key, methodArgs) => {
                let result = method.apply(this, methodArgs);
                if (!result) {
                    const paramNames = getParamNames(target[key]);
                    result = key.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
                    result += " with parameters:";
                    paramNames.forEach((param, index) => {
                        result += `\n- ${param}: ${JSON.stringify(methodArgs[index])}`;
                    });
                }
                return result;
            };

            if (async) {
                return new Promise((resolve) => {
                    resolve(processResult(origMethod, propKey.substring(1), args));
                });
            } else {
                return processResult(origMethod, propKey, args);
            }
        };
    }
};

function aime(obj){
    return new Proxy(obj, handler)
}

function getParamNames(func) {
    const funcStr = func.toString();
    const result = funcStr.slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')')).match(/([^\s,]+)/g);
    return result === null ? [] : result;
}
