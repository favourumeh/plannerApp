import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchObjectivesProject } from "../fetch_entities"

export default function readObjectivesProjectQueryOption(objectiveId, handleNotification, handleLogout) {
    return queryOptions({
        queryKey: [`proj-from-obj-id-${objectiveId}`, objectiveId],
        queryFn: () =>  fetchObjectivesProject(objectiveId, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}