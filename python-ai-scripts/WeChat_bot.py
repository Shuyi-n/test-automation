import hashlib
import time
import re
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse

app = FastAPI()

# 配置信息 
WECHAT_TOKEN = "your_wechat_token"
DIFY_API_URL = "http://localhost/v1/chat-messages"
DIFY_API_KEY = "your_dify_api_key"

user_sessions = {}
processed_msgs = set()

@app.get("/wechat")
async def wechat_verify(signature: str, timestamp: str, nonce: str, echostr: str):
    sort_list = sorted([WECHAT_TOKEN, timestamp, nonce])
    hash_str = "".join(sort_list).encode("utf-8")
    if hashlib.sha1(hash_str).hexdigest() == signature:
        return PlainTextResponse(echostr)
    return PlainTextResponse("验证失败")

@app.post("/wechat")
async def wechat_msg(request: Request):
    body = await request.body()
    body_str = body.decode("utf-8")
    
    content_match = re.search(r"<Content><!\[CDATA\[(.*?)\]\]></Content>", body_str)
    from_user_match = re.search(r"<FromUserName><!\[CDATA\[(.*?)\]\]></FromUserName>", body_str)
    to_user_match = re.search(r"<ToUserName><!\[CDATA\[(.*?)\]\]></ToUserName>", body_str)
    msg_id_match = re.search(r"<MsgId>(\d+)</MsgId>", body_str)
    
    if not (content_match and from_user_match and to_user_match):
        return "success"
        
    user_query = content_match.group(1)
    from_user = from_user_match.group(1)
    to_user = to_user_match.group(1)
    
    # 微信防重试机制
    if msg_id_match:
        msg_id = msg_id_match.group(1)
        if msg_id in processed_msgs:
            print(f"拦截重试请求，丢弃。MsgId: {msg_id}")
            return "success"
        processed_msgs.add(msg_id)
        if len(processed_msgs) > 100: processed_msgs.clear()

    headers = {"Authorization": f"Bearer {DIFY_API_KEY}", "Content-Type": "application/json"}
    data = {
        "inputs": {}, 
        "query": user_query, 
        "response_mode": "blocking", 
        "user": from_user
    }
    
    if from_user in user_sessions:
        data["conversation_id"] = user_sessions[from_user]

    try:
        # 设置超时时间，防止微信侧超时重试
        async with httpx.AsyncClient() as client:
            res = await client.post(DIFY_API_URL, headers=headers, json=data, timeout=4.0) 
            res_json = res.json()
            answer = res_json.get("answer", "抱歉，没查到。")
            
            if "conversation_id" in res_json:
                user_sessions[from_user] = res_json["conversation_id"]
            
            print(f"Dify 回复: {answer}")
            
    except httpx.TimeoutException:
        print("请求 Dify 超时")
        answer = "网络有点小塞车，麻烦您稍后再发一次哦~"
    except Exception as e:
        print(f"请求异常: {e}")
        answer = "系统开小差了，请稍后再试。"
        
    reply_xml = f"<xml><ToUserName><![CDATA[{from_user}]]></ToUserName><FromUserName><![CDATA[{to_user}]]></FromUserName><CreateTime>{int(time.time())}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{answer}]]></Content></xml>"
    return Response(content=reply_xml, media_type="application/xml")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)