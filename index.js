const express = require("express");
const mongodb = require("mongodb");

const app = express();
const uri = "mongodb://localhost:27017";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/search/:value", async (req, res) => {
  const value = req.params.value;

  // Connect to the database
  const client = await mongodb.MongoClient.connect(uri);
  const db = client.db("BinaryTreeDB");

  // Perform the breadth-first search
  const queue = [{ _id: "root" }];
  while (queue.length > 0) {
    const node = queue.shift();

    // Check if the value has been found
    if (node.value === value) {
      res.send(node);
      return;
    }

    // Add the children of the current node to the queue
    if (node.left) {
      queue.push(await db.collection("nodes").findOne({ _id: node.left }));
    }
    if (node.right) {
      queue.push(await db.collection("nodes").findOne({ _id: node.right }));
    }
  }

  // Value not found
  res.send(null);
});

//To add new nodes to the Binary Tree

app.post("/nodes", async (req, res) => {
  const value = req.body.value;
  const parentId = req.body.parentId;
  const isLeftChild = req.body.isLeftChild;

  // Connect to the database
  const client = await mongodb.MongoClient.connect(uri);
  const db = client.db("BinaryTreeDB");

  // Insert the new node into the collection
  const result = await db.collection("nodes").insertOne({ value });
  const newNodeId = result.insertedId;

  // Update the parent node to include a reference to the new node
  if (parentId) {
    if (isLeftChild) {
      await db
        .collection("nodes")
        .updateOne({ _id: parentId }, { $set: { left: newNodeId } });
    } else {
      await db
        .collection("nodes")
        .updateOne({ _id: parentId }, { $set: { right: newNodeId } });
    }
  }

  res.send({ _id: newNodeId });
});

app.listen(3000, () => {
  console.log("API listening on port 3000");
});
