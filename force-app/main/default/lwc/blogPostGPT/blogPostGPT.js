import { LightningElement, wire } from "lwc";
import getPosts from "@salesforce/apex/OpenAIUtility.getPostFromOpenAI";
import createPostRecord from "@salesforce/apex/OpenAIUtility.createPostRecord";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import blogPostMessage from "@salesforce/messageChannel/BlogPostMessage__c";

const NUMBER_OF_WORDS = 800;

export default class BlogPostGPT extends LightningElement {
  text = "";
  error = "";
  subject = "";
  numberOfWords = NUMBER_OF_WORDS;
  showSpinner = false;

  @wire(MessageContext)
  messageContext;

  handleSubject(event) {
    this.subject = event.target.value;
  }

  handleNumberOfWords(event) {
    this.numberOfWords = Number(event.target.value);
  }

  generatePost() {
    if (this.allowToGetPost()) {
      this.clearData();
      this.generatePostinOpenAI();
    }
  }

  allowToGetPost() {
    return this.subject && this.numberOfWords;
  }

  clearData() {
    this.text = "";
    this.error = "";
  }

  async generatePostinOpenAI() {
    this.showSpinner = true;
    getPosts({
      topic: this.subject,
      max_tokens: this.numberOfWords
    })
      .then((response) => {
        this.text = response;
        this.showSpinner = false;
      })
      .catch((error) => {
        console.log("Error: " + JSON.stringify(error));
        this.error = error;
        this.text = this.getErrorText(error.body.message);
        this.showSpinner = false;
      });
  }

  getErrorText(str) {
    if (str.indexOf("read out")) {
      return "<h2>OpenAI is running busy right now.</h2><p>Try it again in a few minutes.</p>";
    }
    return (
      "<h2>Error: " +
      str +
      ".</h2><p>Try it again or contact to our support team.</p>"
    );
  }

  savePostData() {
    if (this.allowToGetPost() && this.text) {
      this.showSpinner = true;
      createPostRecord({
        topic: this.subject,
        numberOfWords: this.numberOfWords,
        text: this.text
      })
        .then(() => {
          this.showToggle(
            "Success",
            "Post record has been created successfully!",
            "success"
          );
          this.showSpinner = false;
          this.refreshDisplayPosts();
        })
        .catch((error) => {
          let errorMsg = "Contact the adming";
          if (error && error.body) {
            errorMsg = error.body.message;
          }
          this.showToggle("Error creating record", errorMsg, "error");
          this.showSpinner = false;
        });
    }
  }

  refreshDisplayPosts() {
    this.clearPostInputFields();
    this.sendMessagePost();
  }

  clearPostInputFields() {
    this.clearData();
    this.subject = "";
    this.numberOfWords = NUMBER_OF_WORDS;
  }

  sendMessagePost() {
    const payload = { refreshTable: true };
    publish(this.messageContext, blogPostMessage, payload);
  }

  showToggle(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
}
