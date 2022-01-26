module.exports = (inputArray, itemsPerChunk) => {
    var chunkedArray = inputArray.reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index / itemsPerChunk);
      
        if(!resultArray[chunkIndex]) resultArray[chunkIndex] = []
      
        resultArray[chunkIndex].push(item);
      
        return resultArray;
    }, []);

    return chunkedArray;
};