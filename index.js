import weaviate, { toBase64FromBlob } from 'weaviate-ts-client';
import * as fs from 'fs';

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
})

const schemaConfig = {
  'class': "Meme",
  'vectorizer': "img2vec-neural",
  'vectorIndexType': "hnsw",
  'moduleConfig': {
    "img2vec-neural": {
      'imageFields': ["image"],
    },
  },
  'properties': [
    {
      'name': "image",
      'dataType': ["blob"],
    },
    {
      'name': "text",
      'dataType': ["string"],
    },
  ],
};

// const res = await client.schema.getter().do();

// const img = fs.readFileSync('./img/frontend.jpg');

// const b64 = Buffer.from(img).toString('base64');

// const res = await client.data.creator().withClassName('Meme').withProperties({
//     image: b64,
//     text: 'frontend meme'
// }).do()


function fileToBase64(filePath) {
  const fileContent = fs.readFileSync(filePath);
  return Buffer.from(fileContent).toString("base64");
}

const imgFiles = fs.readdirSync("./img");
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
await Promise.all(promises)
console.log('123')

const test = Buffer.from(fs.readFileSync("./test.jpg")).toString("base64");
const resImage = await client.graphql
  .get()
  .withClassName("Meme")
  .withFields(["image"])
  .withNearImage({ image: test })
  .withLimit(1)
  .do();
const result = resImage.data.Get.Meme[0].image;
fs.writeFileSync("./result.jpg", result, "base64");