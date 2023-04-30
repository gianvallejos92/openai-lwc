import { LightningElement, wire, track } from "lwc";
import showPosts from "@salesforce/apex/OpenAIUtility.showPosts";
import { subscribe, MessageContext } from "lightning/messageService";
import BlogPostMessage from "@salesforce/messageChannel/BlogPostMessage__c";

const columns = [
  {
    label: "Topic",
    fieldName: "recordId",
    type: "url",
    initialWidth: 190,
    typeAttributes: {
      label: { fieldName: "Topic__c" }
    }
  },
  { label: "Nro", fieldName: "Number_of_Words__c", fixedWidth: 70 },
  { label: "Post", fieldName: "Generated_Post__c", type: "text" }
];

export default class BlogPostGPTTable extends LightningElement {
  columns = columns;
  @track data = [];
  subscription = null;

  @wire(MessageContext)
  messageContext;

  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      BlogPostMessage,
      (message) => this.handleMessage(message)
    );
  }

  handleMessage(message) {
    if (message.refreshTable) {
      this.showAllPosts();
    }
  }

  connectedCallback() {
    this.subscribeToMessageChannel();
    this.showAllPosts();
  }

  showAllPosts() {
    showPosts({ numberOfPosts: 40 })
      .then((result) => {
        if (result) {
          this.data = result;
          this.data = this.data.map((val) => {
            let recordId = "/" + val.Id;
            return { ...val, recordId };
          });
        }
      })
      .catch((error) => {
        console.error("Error show: " + JSON.stringify(error));
      });
  }
}
