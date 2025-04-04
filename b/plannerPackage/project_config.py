allowed_origins= [
    "http://localhost:3000",
    "http://localhost:5173"
    ]

access_token_dur =  24*60 #(1day) #(~10mins)
refresh_token_dur =  7 #(7days) #3600/86400 #(~1hr)

#generate a new secret key 
#from uuid import uuid4
# str(uuid4()) or uuid4().hex