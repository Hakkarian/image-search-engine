import weaviate, { toBase64FromBlob } from 'weaviate-ts-client';
import * as fs from 'fs';

/* creating a client object to interact with the Weaviate server. It specifies the scheme (http) and the host
(localhost:8080) where the Weaviate server is running. This client object can be used to perform
various operations such as creating classes, adding data, querying data, etc. */
const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
})

/* The `schemaConfig` object is defining the schema for a class called "Meme" in the Weaviate server.
It specifies the properties and data types of the class. */
const schemaConfig = {
  class: "Meme",
  vectorizer: "img2vec-neural",
  vectorIndexType: "hnsw",
  moduleConfig: {
    "img2vec-neural": {
      imageFields: ["image"],
    },
  },
  properties: [
    {
      name: "image",
      dataType: ["blob"],
    },
    {
      name: "text",
      dataType: ["string"],
    },
  ],
};


// create a class with specified config
await client.schema.classCreator().withClass(schemaConfig).do();

// check if client has any classes
const res = await client.schema.getter().do();

// read an image
const img = fs.readFileSync('./img/frontend.jpg');

// convert it to base64
const b64 = Buffer.from(img).toString('base64');

// store it in the vector database
await client.data.creator().withClassName('Meme').withProperties({
    image: b64,
    text: 'frontend meme'
}).do()


// create function which handles all rutine actions, which described above
function fileToBase64(filePath) {
  const fileContent = fs.readFileSync(filePath);
  return Buffer.from(fileContent).toString("base64");
}

// read an entire folder with pictures
const imgFiles = fs.readdirSync("./img");

// go through everyone, convert every picture to base64 format, 
// and store every picture in the vector database
const promises = imgFiles.map(async (imgFile) => {
  const b64 = fileToBase64(`./img/${imgFile}`);

  await client.data
    .creator()
    .withClassName("Meme")
    .withProperties({
      image: b64,
      text: imgFile.split(".")[0].split("_").join(" "),
    })
    .do();
});
// wait for all pictures to be stored in the vector database
await Promise.all(promises)

// read some picture sample in order to find similar photos
const test = Buffer.from(fs.readFileSync("./patrick.png")).toString("base64");

// find similar photos in the vector database.
// if there are any pictures NEARLY similar to the sample
// return it as the result
const resImage = await client.graphql
  .get()
  .withClassName("Meme")
  .withFields(["image"])
  .withNearImage({ image: test })
  .withLimit(1)
  .do();

const result = resImage.data.Get.Meme[0].image;

// convert the result as jpg in base64 format
fs.writeFileSync("./result.jpg", result, "base64");