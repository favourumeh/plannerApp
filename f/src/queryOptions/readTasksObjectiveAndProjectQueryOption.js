import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchTasksObjectiveAndProject } from "../fetch_entities"

export default function readTasksObjectiveAndProjectQueryOption(taskId, handleNotification, handleLogout) {
    return queryOptions({
        queryKey: [`tasks-project-and-objecitve`, {"taskId": taskId}],
        queryFn: () =>  fetchTasksObjectiveAndProject(taskId, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
