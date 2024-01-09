const express = require ("express")
const app = express()
const mongoose = require("mongoose") ;
const _ = require("lodash") ;

app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(express.static("public"))

mongoose.connect("mongodb+srv://admin-surabhi:test123@cluster0.8hn5axk.mongodb.net/todolistDB")

const itemsSchema = new mongoose.Schema({
    name : String
})

const Item = mongoose.model("Item", itemsSchema) ;

const item1 = new Item({
    name : "Welcome to our To-Do List!"
})
const item2 = new Item({
    name : "Hit + to add more items."
})
const item3 = new Item({
    name : "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3] ;

const listSchema = new mongoose.Schema({
    name : String ,
    items : [itemsSchema]
})

const List = mongoose.model("List", listSchema) ;

app.get("/", (req,res) => {
    (async () => {
        var data = await Item.find({}) ;
        if (data.length == 0){
            (async () => {
                try {
                    await Item.insertMany(defaultItems) ;
                    // console.log("Items added successfully") ;
                } catch (err){
                    console.log(err) ;
                }
            })() ;
            res.redirect("/") ;
        } else {
            res.render("list", {listTitle : "Today", newListItems : data})
        }
    })() ;
})

app.get("/about", (req,res) => {
    res.render("about")
})

app.get("/:customListName", (req,res) => {
    const customListName = _.capitalize(req.params.customListName) ;

    List.findOne({name:customListName}).then((foundList) => {
        if (!foundList){
            //create a new list
            const list = new List({
                name : customListName ,
                items : defaultItems
            }) ;
        
            list.save() ;
            res.redirect("/" + customListName) ;
        } else {
            //show existing list
            res.render("list", {
                listTitle : foundList.name ,
                newListItems : foundList.items
            }) ;
        }
    }).catch((err) => {
        console.log(err) ;
    }) ;
})

app.post("/", (req,res) => {
    let itemName = req.body.newItem ;
    let listName = req.body.list ;

    let item = new Item({
        name : itemName
    }) ;
    
    if (listName === "Today"){
        item.save() ;
        res.redirect("/") ;
    } else {
        List.findOne({name : listName}).then((foundList) => {
            foundList.items.push(item) ;
            foundList.save() ;
            res.redirect("/" + listName) ;
        })
    }
})

app.post("/delete", (req,res) => {
    const checkedItemId = req.body.checkbox ;
    const listName = req.body.listName ;
    
    if (listName === "Today"){
        Item.findByIdAndDelete(checkedItemId).then(() => {
            console.log("item deleted successfully") ;
            res.redirect("/") ;
        })
    } else {
        List.findOneAndUpdate({name : listName}, {$pull : {items: {_id:checkedItemId}}}).then((foundList) => {
            res.redirect("/" + listName) ;
        }).catch((err) => {
            console.log(err) ;
        }) ;
    }

})


const PORT = process.env.PORT ;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
