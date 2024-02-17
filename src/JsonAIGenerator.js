import AIGenerator from "./AIGenerator";
import partialParse from "partial-json-parser";

export default class JsonAIGenerator extends AIGenerator{

    constructor(client, language){
        super(client, language);
    }

    createMessages(){
        let messages = super.createMessages();
        if(messages) {
            messages[messages.length - 1].content += ". Please generate the json in valid json format and if there's a property its value is null, don't contain the property. also, Please return only the json without any natural language."
        }
        return messages;
    }
    createModel(text){
        let model;
        
        try{
            model = partialParse(text);

            return model;
        }catch(e){
            console.log("error to parse:" + text);

            if(this.client.onError){
                this.client.onError(e);
            }

            throw e;
        }
    }

}