export function getStartEndDates(number_of_weeks: number) {
  let getEndDate = new Date()

  // Set the date in past by number of week.
  let getStartDate = new Date()
  getStartDate.setDate(getEndDate.getDate() - 7 * number_of_weeks)

  // Convert both dates to string
  let startDate = getStartDate.toISOString().slice(0, 10)
  let endDate = getEndDate.toISOString().slice(0, 10)

  return {
    startDate,
    endDate,
  }
}

export function getRollStatesConditionString(rollStates: string) {
  const rollStatesCase = rollStates.split(",")
  let condtionStr = ""

  for (let i = 0; i < rollStatesCase.length; i++) {
    condtionStr += `student_roll_state.state = '${rollStatesCase[i]}'`
    if (i < rollStatesCase.length - 1) {
      condtionStr += " OR "
    }
  }
  console.log("condtionStr: ", condtionStr)
  return "(" + condtionStr + ")"
}
