public with sharing class OpenAIUtility {
  private final static String OpenAPI_api_key = System.Label.OpenAI_API_KEY;
  private final static String OpenAPI_model = System.Label.OpenAI_model;
  private final static String OpenAI_endpoint = System.Label.OpenAI_endpoint;
  private final static String OpenAI_instruction = System.Label.OpenAI_instruction;
  private final static String OpenAI_temperature = System.Label.OpenAI_temperature;

  @AuraEnabled(cacheable=true)
  public static String getPostFromOpenAI(string topic, String max_tokens) {
    Http http = new Http();
    HttpRequest request = new HttpRequest();

    request.setEndpoint(OpenAI_endpoint);
    request.setMethod('POST');
    request.setHeader('Authorization', 'Bearer ' + OpenAPI_api_key);
    request.setHeader('Accept', 'application/json');
    request.setHeader('Content-Type', 'application/json');
    request.setTimeout(60000);

    String requestBody = generateOpenAIRequestBody(topic, max_tokens);
    request.setBody(requestBody);

    HttpResponse response = http.send(request);
    String textResult = handleTextResponse(response.getBody());

    return textResult;
  }

  private static String getInstructionWithTopic(String topic) {
    String[] instructionList = OpenAI_instruction.split('&');
    return (instructionList.isEmpty())
      ? ''
      : instructionList[0] + topic + instructionList[1];
  }

  private static String generateOpenAIRequestBody(
    String topic,
    String max_tokens
  ) {
    String body = '{';
    body += '"model":"' + OpenAPI_model + '", ';
    body += '"prompt":"' + getInstructionWithTopic(topic) + '", ';
    body += '"max_tokens":' + max_tokens + ', ';
    body += '"temperature":' + OpenAI_temperature;
    body += '}';
    return body;
  }

  private static string handleTextResponse(String responseBody) {
    String text = '';
    Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(
      responseBody
    );
    if (results.containsKey('choices')) {
      List<Object> choicesResult = (List<Object>) results.get('choices');
      for (Object cur : choicesResult) {
        Map<String, Object> textResult = (Map<String, Object>) cur;
        if (textResult.containsKey('text')) {
          text = (String) textResult.get('text');
        }
      }
    }
    return text;
  }

  @AuraEnabled
  public static Post__c createPostRecord(
    String topic,
    Integer numberOfWords,
    String text
  ) {
    try {
      Post__c post = new Post__c();
      post.Name = topic;
      post.Topic__c = topic;
      post.Number_of_Words__c = numberOfWords;
      post.Generated_Post__c = text;

      insert post;
      return post;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static List<Post__c> showPosts(Integer numberOfPosts) {
    try {
      List<Post__c> posts = [
        SELECT Id, Topic__c, Number_of_Words__c, Generated_Post__c
        FROM Post__c
        ORDER BY CreatedDate DESC
        LIMIT :numberOfPosts
      ];
      return posts;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
