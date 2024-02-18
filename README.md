
AI application development often requires a balance between leveraging the power of AI and maintaining object-oriented programming principles. Traditional frameworks like LangChain and Semantic Kernel offer robust solutions but may require developers to adapt their design patterns to fit the AI integration model.

# Langobject Framework
The langobject framework aims to integrate AI capabilities into applications without compromising the object-oriented design. It does so by wrapping existing classes with AI-enhanced proxies that intercept method calls and optionally redirect them to AI services for processing. This approach allows developers to add AI functionalities with minimal changes to the existing codebase.

Consider the following example where an existing Writer class method generateJoke is enhanced with AI capabilities using langobject:

```js
    class Writer{
        generateJoke(topic, language){}
    }

    //create AI version of Writer
    let writer = langobject(new Writer())
    
    writer.generateJoke("a cute dog", "Korean").then(joke => alert(joke));
```


In this example, the Writer class remains unchanged, preserving its object-oriented design. The langobject framework wraps the Writer instance, providing an AI-enhanced proxy that can intercept the generateJoke method call and process it using AI services.

#### Comparison
- LangChain and Semantic Kernel offer comprehensive solutions for AI integration but may require adapting your application's architecture to fully leverage their capabilities.


```py
    def generate_joke(topic, language):
        prompt = f"As a professional Writer, Generate a joke about {topic} in {language}."
        response = llm(prompt)
        return response

    chain = SingleComponentChain(generate_joke)
    joke = chain.run("a cute dog", "Korean")

    print(joke)
```



- langobject Framework focuses on minimally invasive integration, allowing developers to maintain their object-oriented design while adding AI functionalities. This approach is particularly beneficial for applications where preserving the existing architecture and design patterns is crucial.

In summary, the langobject framework provides a unique solution for integrating AI into applications with minimal disruption to object-oriented principles, offering a contrast to the more invasive integration strategies required by frameworks like LangChain and Semantic Kernel.



# How to use
```
npm i langobject
```
and try following examples:

#### Specifying Prompt

While the default behavior is to automatically generate prompts from the method name and parameters, this example uses a given prompt to request a joke. It explicitly forms the request string, providing more control over the AI's input.

```js
    class Publisher{
        //derives the prompt from the method and parameter names
        generateJoke(topic, language){} 
        
        //use the given prompt
        generateAnotherJoke(topic, language){  
            return `    
                please generate a joke for ${topic} in ${language} language. 
            `
        }

        //using given prompt and returns JSON object
        generateJsonJoke(topic, language){
            return `    
                please generate a joke for ${topic} in ${language} language. 
            
                result must be in JSON format:
                \`\`\`
                {
                    title: title of joke,
                    content: content of joke
                }
                \`\`\`
            `
        }

    }

    const publisher = langobject(new Publisher());

    publisher.generateJsonJoke("a cute dog", "Korean")
        .then(
            result => document.write(result.content)
        )

```


#### Orchestration and Memory
This example illustrates direct orchestration where a Director class orchestrates the workflow between a Writer class, which generates a joke, and a WebPageEditor class, which creates an HTML page based on the joke. The Director class directly manages the interaction between these two classes.

```js
    
    class WebPageEditor{
        createHtmlPage(joke){}
    }

    class Writer{
        generateJoke(topic, language){} 
    }

    class Director{
        constructor(){
            this.writer = langobject(new Writer());
            this.webPageEditor = langobject(new WebPageEditor());
            this.scratchpad=''
        }

        async direct(topic){
            this.scratchpad = await this.writer.generateJoke(topic, "Korean")
            let page = await this.webPageEditor.createHtmlPage(this.scratchpad)

            return (page)
        }
    }

    const publisher = new Director();

    publisher.direct("a cute dog").then(result => document.write(result))

```

#### Form Generator
This example demonstrates how to dynamically generate a form using the VueJS framework with the help of a `Vue2Expert` class. The class includes a method `createForm` that takes an array of field definitions and returns a Vue component template for a form. The `createForm_sanitizeOutput` method is used to sanitize the output, ensuring that only the template content is returned. 
The `return_only_code__without_any_explanation` argument instructs the method to exclude any additional explanations beyond code generation.(Arguments with '_' in their names are identified as additional directives for the prompt)
    

```html
<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>

<div id="app"></div>

<script type="module">
    import langobject from '../src/langobject.js'
    
    class Vue2Expert{
        createForm(fields, return_only_code__without_any_explanation){
        }

        createForm_sanitizeOutput(text){
            const templateContentMatch = text.match(/<template>(.*?)<\/template>/gs);
            return templateContentMatch ? templateContentMatch[0].replace(/<template>|<\/template>/gs, '') : '';
        }
    }

    (async ()=>{

        let expert = new Vue2Expert()
        
        let result = await langobject(expert).createForm([
            {fieldName: 'Name', type: 'string', mandatory: true},
            {fieldName: 'RegistrationDate', type: 'date', mandatory: true},
            {fieldName: 'NumberOfPeople', type: 'int', default: 2},
        ], true)

        // Register result as a Vue component
        Vue.component('dynamic-form', {
            template: result
        });

        // Create a new Vue instance and mount it to #app to render the dynamic component
        new Vue({
            el: '#app'
        });
    })()

</script>
```
If you desire the outcome for Vue3, simply changing the class name from Vue2Expert to Vue3Expert works like magic.

#### Tool Invocation
In this example, a Scheduler class defines a tool (method) called calculate within its createSchedule method. This demonstrates how a tool can be invoked internally within the orchestration logic, showcasing a pattern where tools are defined and used within the same class.

```js
    
    class Scheduler{
        createSchedule(topic){
            return {
                "tools": [this.calculate]
            }
        }

        calculate(expression){
            try{
                return eval(expression)
            }catch(e){
                return "Failed to evaluate expression: " + expression
            }
        }
    }

    document.write(langobject(new Scheduler()).createSchedule("4 days trip for South Korea"))
```


#### Multi-Agent
This example shows a multi-agent system where a Scheduler class creates a schedule that includes multiple agents (Planner and Calculator). It demonstrates a pattern for orchestrating tasks among multiple agents, where each agent has a specific role or function.

```js
    
    class Scheduler{
        createSchedule(topic){
            return {
                "co-workers": [Planner, Calculator]
            }
        }
    }

    class Calculator{
        calculate(expression){}
    }

    class Planner{
        plan(topic){}
    }

    document.write(langobject(new Scheduler()).createSchedule("4 days trip for South Korea"))
```

# How to try

```
npm run serve
```

Please navigate to http://localhost:3000/demo/ in your browser. Once there, open the browser's console and set your OpenAI API key by executing localStorage.setItem('OPENAI_API_KEY', 'sk...'). Afterward, proceed to the src folder and try running the various HTML files available there.

![Screenshot](screenshot.png)
