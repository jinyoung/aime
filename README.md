AI application development often requires a balance between leveraging the power of AI and maintaining object-oriented programming principles. Traditional frameworks like LangChain and Semantic Kernel offer robust solutions but may require developers to adapt their design patterns to fit the AI integration model.

#### AIME Framework
The AIME framework aims to integrate AI capabilities into applications without compromising the object-oriented design. It does so by wrapping existing classes with AI-enhanced proxies that intercept method calls and optionally redirect them to AI services for processing. This approach allows developers to add AI functionalities with minimal changes to the existing codebase.

Consider the following example where an existing Publisher class method generateJoke is enhanced with AI capabilities using AIME:

```js
    class Publisher{
        //derives the prompt from the method and parameter names
        generateJoke(topic, language){}
        
    }

    //create AI version of Publisher
    publisher = aime(new Publisher())

    let joke = publisher.generateJoke("a cute dog", "Korean")

    alert(joke)


    // You'll also get an async version as a bonus!
    publisher.agenerateJoke("a cute dog", "Korean").then(joke => alert(joke));
```


In this example, the Publisher class remains unchanged, preserving its object-oriented design. The AIME framework wraps the Publisher instance, providing an AI-enhanced proxy that can intercept the generateJoke method call and process it using AI services.

#### Comparison
- LangChain and Semantic Kernel offer comprehensive solutions for AI integration but may require adapting your application's architecture to fully leverage their capabilities.


```py
    # 농담을 생성하는 함수를 정의합니다.
    def generate_joke(topic, language):
        prompt = f"Generate a funny joke about {topic} in {language}."
        response = llm(prompt)
        return response

    # SingleComponentChain을 사용하여 체인을 생성하고 실행합니다.
    chain = SingleComponentChain(generate_joke)
    joke = chain.run("a cute dog", "Korean")

    print(joke)
```



- AIME Framework focuses on minimally invasive integration, allowing developers to maintain their object-oriented design while adding AI functionalities. This approach is particularly beneficial for applications where preserving the existing architecture and design patterns is crucial.

In summary, the AIME framework provides a unique solution for integrating AI into applications with minimal disruption to object-oriented principles, offering a contrast to the more invasive integration strategies required by frameworks like LangChain and Semantic Kernel.

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

    document.write(aime(new Scheduler()).createSchedule("4 days trip for South Korea"))
```

#### Direct Orchestration
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
            this.writer = aime(new Writer());
            this.webPageEditor = aime(new WebPageEditor());
        }

        direct(topic){
            let joke = this.writer.generateJoke(topic, "Korean")
            let page = this.webPageEditor.createHtmlPage(joke)

            return (page)
        }
    }

    const publisher = new Director();

    document.write(publisher.direct("a cute dog"))
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

    document.write(aime(new Scheduler()).createSchedule("4 days trip for South Korea"))
```

