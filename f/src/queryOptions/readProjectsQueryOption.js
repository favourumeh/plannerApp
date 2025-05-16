import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchUserProjects } from "../fetch_entities"

export default function readProjectsQueryOption(showNoti, handleNotification, handleLogout) {
    //query's db for objectives of a project
    return queryOptions({
        queryKey: ["projects"],
        queryFn: () =>  fetchUserProjects(showNoti, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}