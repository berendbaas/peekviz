function count_occurrences_in_string(str, regex) {
  return (str.match(new RegExp(regex ,"g")) || []).length; //https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
}
