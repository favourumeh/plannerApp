import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchProjectsObjectives } from "../fetch_entities"

export default function readProjectsObjectivesQueryOption(projectId, handleNotification, handleLogout) {
    //query's db for objectives of a project
    return queryOptions({
        queryKey: ["project-objectives", projectId],
        queryFn: () =>  fetchProjectsObjectives(projectId, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}