var brain = require('brain');
var basenet = new brain.NeuralNetwork({hiddenLayers:[80]}); //Base neural-network, for executing Turing instructions
//OPCODE list: .0 -- AND, .4 -- OR, .9 -- NOT
//This set of operations should be turing-complete. In other words; we should be able to express
//all operations of a hypothetical turing machine using these instructions

//Train the basenet on truth tables for each OPCODE
var table = [
    //AND
    {input:[0,0,0],output:[0]},
    {input:[0,1,0],output:[0]},
    {input:[0,1,1],output:[1]},
    {input:[0,0,1],output:[0]},
    //OR
    {input:[.4,0,0],output:[0]},
    {input:[.4,1,0],output:[1]},
    {input:[.4,1,1],output:[1]},
    {input:[.4,0,1],output:[1]},
    //NOT
    {input:[.9,0,0],output:[1]},
    {input:[.9,1,0],output:[0]},
    {input:[.9,1,1],output:[0]},
    {input:[.9,0,1],output:[1]},
    
];
basenet.train(table,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
//Test the neural-net
//AND
console.log(basenet.run([0,0,0]) > .5);
console.log(basenet.run([0,0,1]) > .5);
console.log(basenet.run([0,1,1]) > .5);
console.log(basenet.run([0,1,0]) > .5);

//OR
console.log(basenet.run([.4,0,0]) > .5);
console.log(basenet.run([.4,0,1]) > .5);
console.log(basenet.run([.4,1,1]) > .5);
console.log(basenet.run([.4,1,0]) > .5);
//NOT
console.log(basenet.run([.9,0,0]) > .5);
console.log(basenet.run([.9,0,1]) > .5);
console.log(basenet.run([.9,1,1]) > .5);
console.log(basenet.run([.9,1,0]) > .5);
