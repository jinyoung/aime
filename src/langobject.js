import AIGenerator from "./AIGenerator.js";

const handler = {
    get(target, propKey, receiver) {
        let origMethod = target[propKey];

        let async = false;
        if (!origMethod && propKey.startsWith('a') && target[propKey.substring(1)]) {
            propKey = propKey.substring(1)
            origMethod = target[propKey];
            async = true;
        }
        
        return function(...args) {
            // 공통 로직을 처리하는 함수
            
            let prompt = origMethod.apply(this, args);
            if (!prompt) {
                prompt = "As a " + target.constructor.name + ", ";
                const paramNames = getParamNames(target[propKey]);
                prompt += propKey.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
                prompt += " with parameters:";
                paramNames.forEach((param, index) => {
                    if (!param.includes('_')) {
                        prompt += `\n- ${param}: ${JSON.stringify(args[index])}`;
                    }
                });

                const underscoreParamNames = paramNames.filter(name => name.includes('_')).map(name => name.replace(/_/g, ' ').toUpperCase());
                if (underscoreParamNames.length > 0) {
                    prompt += "\n\nSELF CRITICISM:";
                    underscoreParamNames.forEach(name => {
                        prompt += `\n- ${name}`;
                    });
                }
            }

            if (async) {}


            return new Promise((resolve) => {

                let aiGenerator = new AIGenerator({
                    onGenerationFinished(model){

                        if(prompt.includes("result must be in JSON format:")) {
                            try {
                                model = JSON.parse(model);
                            } catch (error) {
                                console.error("Failed to parse model to JSON", error);
                            }
                        }

                        let sanitizeMethod = target[propKey + "_sanitizeOutput"];
                        if (typeof sanitizeMethod === "function") {
                            model = sanitizeMethod.call(target, model);
                        }

                        resolve(model)
                    }
                })
                
                aiGenerator.prompt=prompt
                
                if(localStorage.getItem("LANGOBJECT_DEBUG") !== "false"){
                    console.log("[langobject] using prompt: ", prompt)
                }
    
                aiGenerator.generate()
    
            });
            
        };
    }
};

export default function langobject(obj){
    return new Proxy(obj, handler)
}

function getParamNames(func) {
    const funcStr = func.toString();
    const result = funcStr.slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')')).match(/([^\s,]+)/g);
    return result === null ? [] : result;
}
