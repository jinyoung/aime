export default class AIGenerator {
    constructor(client, options){
        this.client = client;
        this.finish_reason = null;
        this.modelJson = null;
        this.stopSignaled = false;
        this.gptResponseId = null;
        this.openaiToken = null
        this.model = "gpt-3.5-turbo-16k" 
        //this.model = "gpt-4" 

        if(options) {
            this.preferredLanguage = options.preferredLanguage;
            this.previousMessages = options.previousMessages;
            this.prompt = options.prompt;
            this.model = options.model || this.model;
            this.options = options
        } else {
            this.options = {}
        }

        if(!this.previousMessages) {
            this.previousMessages = [];
        }

        if(!this.prompt) {
            this.prompt = "";
        }
        
        // if(!this.preferredLanguage) {
        //     this.preferredLanguage = "English";

        //     if(window && window.countryCode == 'ko') {
        //         this.preferredLanguage = "Korean";
        //     }
        // }

    }
    
    createPrompt(){
        return this.prompt ? this.prompt : "say hello in Korean.";
    }

    stop(){
        this.stopSignaled = true;
    }

    getToken() {
        const apiKey = window.localStorage.getItem("OPENAI_API_KEY");
        if (!apiKey) {
            console.error("Error: OPENAI_API_KEY is not set in localStorage. Please set it by using 'localStorage.setItem(\"OPENAI_API_KEY\", \"Your-OpenAI-API-Key\")' in your browser's console.");
        }
        return apiKey;
    }

    generateHashKey(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }


    async generate(){

        this.state = 'running'
        let me = this;
        let messages = this.createMessages();


        if(localStorage.getItem("useCache")=="true"){
            let message = JSON.stringify(messages)

            let hashKey = this.generateHashKey(message)
            let existingResult = localStorage.getItem("cache-" + hashKey)

            if(existingResult){
                setTimeout(()=>{

                    me.state = 'end';

                    let model = me.createModel(existingResult)
        
                    if(me.client.onModelCreated){
                        me.client.onModelCreated(model);
                    } 
                    
                    if(me.client.onGenerationFinished)
                        me.client.onGenerationFinished(model)
        

                }, 0)

                return
            }

        }

        me.openaiToken = me.getToken();
        let responseCnt = 0;
        
        me.gptResponseId = null;
        const url = "https://api.openai.com/v1/chat/completions";
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + me.openaiToken);

        xhr.onprogress = function(event) {
            var currentResId
            if(me.stopSignaled){
                xhr.abort();
                me.stopSignaled = false;
                me.state = 'stopped'
            }
            // console.log("Received " + event.loaded + " bytes of data.");
            // console.log("Data: " + xhr.responseText);
            const newUpdates = xhr.responseText
            .replace("data: [DONE]", "")
            .trim()
            .split('data: ')
            .filter(Boolean)

            const newUpdatesParsed = newUpdates.map((update) => {
                const parsed = JSON.parse(update);

                if(parsed.error){
                    if(me.client.onError){
                        me.client.onError(parsed.error);
                    }
                    throw new Error(parsed.error.message)
                }

                currentResId = parsed.id
                if(!me.gptResponseId){
                    me.gptResponseId = parsed.id
                } 
                if(parsed.choices[0].finish_reason == 'length'){
                    me.finish_reason = 'length'
                }
                return parsed.choices[0].delta ? parsed.choices[0].delta.content : parsed.choices[0].message.content || '';
            });

            const newUpdatesJoined = newUpdatesParsed.join('')
            if(newUpdatesJoined.includes(": null")){
                newUpdatesJoined.replaceAll(": null", ": 'null'")
            }
            me.modelJson = newUpdatesJoined

            if(me.client.onReceived){
                if(me.gptResponseId == currentResId){
                    me.client.onReceived(newUpdatesJoined);
                }
            }

            if(me.client.onModelCreated){
                if(responseCnt > 15){
                    me.client.onModelCreated(me.createModel(newUpdatesJoined));
                    responseCnt = 0;
                } else {
                    responseCnt++;
                }
            }


        };

        xhr.onloadend = function() {
            console.log("End to Success - onloadend", xhr);
            if(me.client){
                if(me.finish_reason == 'length'){
                    // me.continue();
                    console.log('max_token issue')
                } 
    
                me.state = 'end';
                let model = me.createModel(me.modelJson)

                if(me.client.onModelCreated){
                    me.client.onModelCreated(model);
                } 
                
                if(me.client.onGenerationFinished)
                    me.client.onGenerationFinished(model)

                if(localStorage.getItem("useCache")=="true"){
                    let hashKey = me.generateHashKey(JSON.stringify(messages))
                    localStorage.setItem("cache-" + hashKey, me.modelJson)
                }
            
            }

            me.previousMessages.push({
                role: 'system',
                content: me.modelJson
            })
        };

        

        if(this.isContinued) messages[messages.length-1].content = "continue";

        
        const data = JSON.stringify({
            model: this.model,
            messages: messages,
            temperature: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: this.options.isStream,
        });

        xhr.send(data);

    }

    createMessages(){
        var me = this 
        
        if(me.client.openAiMessageList){
            me.client.openAiMessageList.push({
                role: 'user',
                content: me.createPrompt()  + (me.preferredLanguage ? "\n please generate in " + me.preferredLanguage : '')
            })
            me.previousMessages = me.client.openAiMessageList;
        } else {
            me.previousMessages.push({
                role: 'user',
                content: me.createPrompt()  + (me.preferredLanguage ? "\n please generate in " + me.preferredLanguage : '')
            })
        }
        
        return me.previousMessages;
    }

    continue(){
        this.isContinued = true;
        this.generate();
    }

    createModel(text){
        return text;
    }


}