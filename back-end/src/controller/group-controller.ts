import { NextFunction, Request, Response } from "express"
import { getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { GroupStudent } from "../entity/group-student.entity"
import { Student } from "../entity/student.entity"
import { CreateGroupStudentInput } from "../interface/group-student.interface"
import { QueryResult } from "../interface/query-result.interface"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { Roll } from "../entity/roll.entity"
import { getStartEndDates, getRollStatesConditionString } from "../library/util"

export class GroupController {
  private groupRepository = getRepository(Group)
  private groupStudentRepository = getRepository(GroupStudent)
  private studentRepository = getRepository(Student)
  private studentRollStateRepository = getRepository(StudentRollState)

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of all groups
    return this.groupRepository.find()
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Add a Group
    try {
      const { body: payload } = request

      const createGroupInput: CreateGroupInput = {
        name: payload.name,
        number_of_weeks: payload.number_of_weeks,
        roll_states: payload.roll_states,
        incidents: payload.incidents,
        ltmt: payload.ltmt,
      }
      const group = new Group()
      group.prepareToCreate(createGroupInput)
      const groupResponse = await this.groupRepository.save(group)
      return {
        statusCode: 200,
        message: "Created group",
        Data: groupResponse,
      }
    } catch (error) {
      console.error("ERROR_CREATE_GROUP", error)
      return { code: 500, message: "Internal server error", error }
    }
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Update a Group
    try {
      const { body: params } = request

      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
        run_at: params.run_at,
        student_count: params.student_count,
      }

      const groupToUpdate = await this.groupRepository.findOne({ id: params.id })

      if (groupToUpdate) {
        const updates = new Group()
        updates.prepareToUpdate(updateGroupInput)
        return this.groupRepository.save({ id: groupToUpdate.id, ...updates })
      } else {
        return {
          code: 404,
          message: "Group not found",
        }
      }
    } catch (error) {
      return {
        code: 500,
        message: "Internal server error",
        error,
      }
    }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Delete a Group
    try {
      let removeGroup = await this.groupRepository.findOne(request.params.id)
      if (removeGroup) {
        await this.groupRepository.delete(removeGroup)
        return {
          Message: "Group Successfully Deleted",
        }
      }
    } catch (error) {
      console.error("ERROR_REMOVE_GROUP", error)
      return {
        Messsage: "Internal server error",
      }
    }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of Students that are in a Group
    const getStudentsInGroup = await this.studentRepository
      .createQueryBuilder("student")
      .innerJoin(GroupStudent, "group_student", "student.id = group_student.student_id")
      .where("group_student.group_id = :id", { id: request.params.id })
      .getMany()

    return getStudentsInGroup
  }

  private async addStudentToGroup(id: number, queryResult: QueryResult[]) {
    queryResult.forEach(async (student: QueryResult) => {
      const createGroupStudentInput: CreateGroupStudentInput = {
        student_id: student.student_id,
        group_id: id,
        incident_count: student.incident_count,
      }

      const groupStudent = new GroupStudent()
      groupStudent.prepareToCreate(createGroupStudentInput)
      await this.groupStudentRepository.save(groupStudent)
    })
  }

  private async updateMetaData(id: number, studentCount: number) {
    // Update metadata
    const y = await this.groupRepository.save({
      id: id,
      run_at: new Date(),
      student_count: studentCount,
    })
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
    // 1. Clear out the groups (delete all the students from the groups)
    // 2. For each group, query the student rolls to see which students match the filter for the group
    // 3. Add the list of students that match the filter to the group
    try {
      await this.groupStudentRepository.clear()

      let allGroups = await this.groupRepository.find()
      allGroups.forEach(async (group) => {
        // query result will contain the student id and the number of incidents that student has matched with the current group

        const { startDate, endDate } = getStartEndDates(group.number_of_weeks)
        const conditionString = getRollStatesConditionString(group.roll_states)

        let queryResult: QueryResult[] = await this.studentRollStateRepository
          .createQueryBuilder("student_roll_state")
          .select("student_id")
          .addSelect("COUNT(student_roll_state.student_id) AS incident_count")
          .innerJoin(Roll, "roll", "student_roll_state.roll_id = roll.id")
          .where("roll.completed_at BETWEEN :startDate AND :endDate", { startDate, endDate })
          .andWhere(conditionString)
          .groupBy("student_roll_state.student_id")
          .having(`incident_count ${group.ltmt} :incidents`, { incidents: group.incidents })
          .getRawMany()

        console.log("Group ID", group.id, "Results", queryResult)
        // adding the result of the query to the group_student table
        await this.addStudentToGroup(group.id, queryResult)

        // updating the meta data fields in the group table for the current group. student count is length of the query result
        await this.updateMetaData(group.id, queryResult.length)
      })
      response.send("Group filters finished running")
    } catch (error) {
      console.error("ERROR_REMOVE_GROUP", error)
      return {
        Messsage: "Internal server error",
      }
    }
  }
}
