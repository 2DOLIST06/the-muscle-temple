from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context()
    page=context.new_page();page.goto('http://127.0.0.1:3199/contact')
    # Exercise the unchanged Next server login handlers against the local fake API.
    for route,name in [('/user-api/auth/login','user_jwt'),('/admin-api/login','admin_jwt')]:
        response=context.request.post('http://127.0.0.1:3199'+route,data={'email':'test@example.invalid','password':'test-password'})
        assert response.ok, response.status
        cookie=next(cookie for cookie in context.cookies() if cookie['name']==name)
        assert cookie['value']=='test.payload.signature' and cookie['httpOnly']
    assert page.evaluate("fetch('/user-api/auth/me').then(response => response.status)")==200
    page.get_by_role('button',name='Reject all',exact=True).click()
    page.reload()
    assert page.evaluate("fetch('/user-api/auth/me').then(response => response.status)")==200
    assert {'user_jwt','admin_jwt'}.issubset({cookie['name'] for cookie in context.cookies()})
    page.get_by_role('button',name='Manage my cookies',exact=True).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    # Focus stays in the modal when navigating with Tab, and returns on Escape.
    for _ in range(8):
        page.keyboard.press('Tab')
        assert page.evaluate('document.querySelector("dialog").contains(document.activeElement)')
    page.keyboard.press('Escape')
    expect(page.get_by_role('button',name='Manage my cookies',exact=True)).to_be_focused()
    assert page.evaluate("fetch('/user-api/auth/me').then(response => response.status)")==200
    print('PASS: member/admin login handlers with mock upstream; HttpOnly sessions survive refusal/reload; member session endpoint works; keyboard focus trapping/restoration')
    browser.close()
