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

            let toolPrompt = null;
            if (typeof prompt === "string") prompt = prompt
            if (typeof prompt === "object"){
       
                prompt = prompt.prompt;

            }


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


            if (target.tools && Array.isArray(target.tools)) {
                let toolDef = ''
                target.tools.forEach((tool) => {
                    const toolName = tool.name;
                    const argNames = getParamNames(tool);
                    toolDef += `- ${toolName}, args: ${argNames.join(", ")}\n`;
                });

                if(toolDef){
                    toolPrompt = `
You can ONLY use following tools list to process the users's request:
${toolDef}
return the tool invocations (may be one or more) context with following JSON format:

[{
    "tool": "tool name to invoke",
    "args":[
        {
            "arg name" : "arg value"
        } 
    ],
    "messageToUser": "additional message to user"
}]

If the request does not exist in the tool list, you MUST return that the requested question cannot be processed.
                    `
                }

                if(toolPrompt) prompt += "\n\n"+ toolPrompt
            }

            

            if (async) {}


            return new Promise((resolve) => {

                let aiGenerator = new AIGenerator({
                    onGenerationFinished(result){

                        if(prompt.includes("result must be in JSON format:")) {
                            try {
                                result = JSON.parse(result);
                            } catch (error) {
                                console.error("Failed to parse result to JSON", error);
                            }
                        }

                        let sanitizeMethod = target[propKey + "_sanitizeOutput"];
                        if (typeof sanitizeMethod === "function") {
                            result = sanitizeMethod.call(target, result);
                        }

                        if (target.messages && Array.isArray(target.messages)) {
                            target.messages.push({role: "system", content: result});
                        }

                        if(toolPrompt)
                        try {
                            let parsedResult = JSON.parse(result);
                            if (Array.isArray(parsedResult) && parsedResult.length > 0 && parsedResult[0].hasOwnProperty('tool')) {
                                parsedResult.forEach(toolInvocation => {
                                    if (target[toolInvocation.tool] && typeof target[toolInvocation.tool] === 'function') {
                                        let args = Object.keys(toolInvocation.args).map(key => toolInvocation.args[key]);
                                        target[toolInvocation.tool](...args);
                                    }
                                });
                            }
                        } catch (error) {
                            console.error("Failed to parse tool invocation string to JSON", error);
                        }

                        resolve(result)
                    },
                    onStream(chunk){
                        if (typeof target.stream === 'function') {
                            target.stream(chunk)
                        }
                    }
                    
                })

                if(target.messages) {
                    aiGenerator.previousMessages = target.messages;
                }

                if (typeof target.stream === 'function') {
                    aiGenerator.options.isStream = true;
                }
                
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
