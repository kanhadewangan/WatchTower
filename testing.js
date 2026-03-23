

function postReq() {
    const data = fetch('http://localhost:3000/api/v1/checks/add_check', {
        method: 'POST',

        headers: {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW1wemJ6cWcwMDAwdHNmZ3Q3Z2JjNGd6IiwidXNlckVtYWlsIjoiZ3lvdWtvMDNAZ21haWwuY29tIiwiaWF0IjoxNzczNDcxODQ0LCJleHAiOjE3NzM1NTgyNDR9.V6LmZqTIb9Ep2eGTcBE0ElSGBuZ8lhISLUl8M2AZO5Y',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({websitename: "testing", region: "US_EAST_1"})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);    
    })
}


postReq()