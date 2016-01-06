var brain = require('brainjs');
var fs = require('fs');
var basenet;
//OPCODE list: .0 -- AND, .4 -- OR, .9 -- NOT
//This set of operations should be turing-complete. In other words; we should be able to express
//all operations of a hypothetical turing machine using these instructions

//Make a neural-network
var mknet = function (trainingData) {
    var net = new brain.NeuralNetwork({hiddenLayers: [80]});
    net.train(trainingData, {errorThresh: .05, iterations: 200000, log: true, logPeriod: 20, learningRate: .2});

    return net;
};
var mknetFromFunctionSync = function (trainingSample, inputs, func) {
    var net = new brain.NeuralNetwork({hiddenLayers: [80]});
    net.train(trainingSample, {errorThresh: .05, iterations: 1, learningRate: .2, log: false});
    var threshold = .05;
    var err = 1;
    while (err > .05) {
        err = 0;
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            err += Math.abs(net.trainFunction(input, function (output) {
                return func(input, output);
            }, .2));
        }
        
        //err/=inputs.length;
        //console.log('Current error: '+err);
        
    }
    return net;
};
//TODO: Test NEW method
var inputs = new Array();
var addOpCode = function (opcode) {
    inputs.push([opcode, 0, 0], [opcode, 0, 1], [opcode, 1, 0], [opcode, 1, 1]);
};
addOpCode(0);
addOpCode(.4);
addOpCode(.9);
basenet = mknetFromFunctionSync({input: [0, 0, 0], output: [0]}, inputs, function (input, output) {
    switch (input[0]) {
        case 0:
            return [(input[1] & input[2]) - output[0]];
            break;
        case .4:
            return [(input[1] | input[2]) - output[0]];
            break;
        case .9:
            return [(!input[1]) - output[0]];
            break;
        default:
            throw 'sideways';
    }
});
for (var i = 0; i < inputs.length; i++) {
    input = inputs[i];
    console.log('OP ' + input[0] + ': ' + input[1] + ',' + input[2] + ' == ' + (basenet.run(input) > .5) * 1);
}

var nets = {};
nets.logic = basenet.toJSON();




//Create thresholding neural-network
table = new Array();
var accuracy = 500;
for (var i = 0; i < accuracy; i++) {
    table.push({input: [i / accuracy], output: [((i / accuracy) > .5) * 1]});
}
nets.threshold = mknet(table).toJSON();
//TODO: XOR from existing logic gates
var xorinputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
var f2n = function (bits, number) {
    //Convert from float (between 0 and 1) to number of specified number of bits
    var max = Math.pow(2, bits);
    return (max * number) | 0;
};
//Convert from int of n bits to float
var n2f = function (bits, number) {
    //Convert from int to float
    return number / (Math.pow(2,bits) - 1);
};

var byteFromBits = function(bits) {
    var retval = 0;
    for(var i = 0;i<8;i++) {
        retval |= bits[i] << 7-i;
    }
    return retval;
};
var bitsFromByte = function(number) {
    var retval = new Array();
    for(var i = 0;i<8;i++) {
        retval.push((number & (1 << (7-i)))>0);
    }
    return retval;
};
var bitsFromBuffer = function(buffer) {
    var retval = new Array();
    for(var i = 0;i<buffer.length;i++) {
        retval.push.apply(retval,bitsFromByte(buffer[i]));
    }
    return retval;
};
var bufferFromBits = function(bits) {
    var retval = new Buffer(bits.length/8);
    for(var i = 0;i<retval.length;i++) {
        retval[i] = byteFromBits(bits.slice(i*8,(i*8)+8));
    }
    return retval;
};


var inputs = new Array();
for(var i = 0;i<256;i++) {
    inputs.push(bitsFromByte(i));
}
inputs = inputs.map(function(val){
    return val.map(function(val){
        return val*1;
    });
});
//console.log(inputs);
nets.checkop = mknetFromFunctionSync({input:[0,0,0,0,0,0,0,0],output:[1.0]},inputs,function(input,outputs){
    var retval = (byteFromBits(input)<=2)-outputs[0];
    //console.log(retval);
    //console.log(JSON.stringify(input)+' == '+(outputs[0]>.5));
    return [retval];
});
for(var i = 0;i<8;i++) {
    console.log('Is '+i+' valid? '+nets.checkop.run(bitsFromByte(i)));
}



nets.xor = mknetFromFunctionSync({input: [0, 0], output: [0, 0, 0, 0, 0, 0]}, xorinputs, function (input, outputs) {
    
    
    var bits = 3;
//TODO: Emit some assembly code
    //Valid OPCODES:
    //0 -- Logic operation
    //1 -- Read first input value onto stack
    //2 -- Read second input value onto stack
    var error = new Array();
    for (var i = 0; i < outputs.length; i++) {
        error.push(0.0);
    }
    error[outputs.length-1] = .8;
    var stack = new Array();
   
    var origpop = stack.pop;
    stack.pop = function() {
        if(stack.length>0) {
            return origpop.apply(stack);
        }
        throw 'Failed to pop.';
    };
    
        //console.log(outputs[0]+' == '+f2n(bits,outputs[0]));
    for (var i = 0; i < outputs.length; i++) {
       
        try {
            switch (f2n(bits,outputs[i])) {
                case 0:
                    //Execute logic operation, push results to stack
                    i++;
                    stack.push(nets.logic.run([outputs[i], stack.pop(), stack.pop()]));
                    break;
                case 1:
                    //Push first input value to stack
                    stack.push(input[0]);
                    break;
                case 2:
                    //Push second output value to stack
                    stack.push(input[1]);
                    break;
                default:
                    throw 'up'; //Illegal OPCODE
            }
        } catch (er) {
            //console.log('Error while running program.');
            error[i] = .8;
            for(;i<outputs.length;i++) {
                error[i] = .8;
            }
            if(error[1]<.8) {
                console.log(error);
            }
            return error;
            
        }
    }
    try {
    error[outputs.length-1] = (input[0] ^ input[1])-stack.pop();
    }catch(er) {
        console.log('Error while getting output');
        error[outputs.length-1] = .8;
    }
    return error;
});





//Output the primitive neural-network to the training file
var output = fs.createWriteStream('binops.json');
output.write(JSON.stringify(nets));
output.end();
