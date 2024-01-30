export const stringToTimestamp = (recordedTimestamp: String) => {
    if (
        recordedTimestamp.length !== 10 &&
        recordedTimestamp.length !== 13
    ) {
        throw new Error('Invalid String')
    }

    const recordedTimestampNumber = Number(recordedTimestamp)
    if (isNaN(recordedTimestampNumber)) {
        throw new Error('Invalid String')
    }
    return recordedTimestampNumber
}

export const stringToTimestampMilliseconds = (recordedTimestamp: String) => {
    const recordedTimestampMilliseconds =
        recordedTimestamp.length === 10
            ? recordedTimestamp + '000'
            : recordedTimestamp
    return stringToTimestamp(recordedTimestampMilliseconds)
}
