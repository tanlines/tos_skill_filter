const tool_id = 'active_skill';

let filter_set = new Set();
let option_obj = {};
let or_filter = true;
let sort_by = 'id';
let sort_by_method = [['id', '依編號排序'], ['charge', '依 CD/EP 排序'], ['attribute', '依屬性排序'], ['race', '依種族排序']];
let theme = 'normal';
let owned_cards = [];
let token = '';
let player_id = '';

function refreshOwnedCards()
{
	new_player_id = document.getElementById("player-id-input").value;
	
	if (owned_cards.length > 0 && player_id === new_player_id) {
		return;
	}
	
	owned_cards = [];
	player_id = new_player_id;
	
	if (!token) {
		urll = "https://checkupapi.tosgame.com/user/login?token=&uid=52326271&aid=872594&labels={%22serviceType%22:%22tosCampaign%22}"
		$.getJSON(urll, function(data) {
		// JSON result in `data` variable
			if (data["token"]) {
				token = data["token"];
			}
		});
	}
	url = "https://checkupapi.tosgame.com/api/inventoryReview/getUserProfile?uid=" + player_id + "&includeInventory=true&token="+token;
	
    $.getJSON(url, function(data) {
    // JSON result in `data` variable
		if (data["cards"]) {
			owned_cards = data["cards"];
		}
	});
	
	//if (owned_cards.length == 0) {
	//	alert("Couldn't load player cards");
	//}
}

$(document).ready(function() {
    init();
    
    location.search && readUrl();
});

function openOptionPanel()
{
    $('#optionPanel').modal('show');
    renderOptionPanel();
}

function renderOptionPanel() {
    let hasSelectedSkill = false;
    $(".filter-row .filter").each(function() {
        if($(this).prop('checked'))
        {
            if(!(Object.keys(option_obj).includes($(this).next("label").text())))
            {
                option_obj[$(this).next("label").text()] = Array(option_text.length).fill(false);
            }
            hasSelectedSkill = true;
        }
        else 
        {
            if($(this).next("label").text() in option_obj)
            {
                delete option_obj[$(this).next("label").text()];
            }
        }
    });
    
    let render_str = "";
    let option_id = 0;
    skill_type_string.forEach(function(row) {
        row.forEach(function(skill) {
            if(Object.keys(option_obj).includes(skill))
            {
                render_str += "<div class='row option-row'>";
                render_str += "     <div class='col-12 col-md-12 col-lg-4 option-text'>"+skill+"</div>";
                option_text.forEach(function(text, j){
                    render_str += "     <div class='col-12 col-md-4 col-lg-2 btn-shell'><input type='checkbox' class='filter' id='option-"+(option_id*option_text.length+j)+"' "+(option_obj[skill][j] ? 'checked': '')+"><label class='p-1 w-100 text-center option-btn' for='option-"+(option_id*option_text.length+j)+"'>"+text+"</label></div>";
                })
                render_str += "<hr>";
                render_str += "</div>";
                option_id ++;
            }
        })
    })
    
    $(".modal-body").html(render_str)
}

function recordOption() {
    $(".option-row").each(function(){
        let option_text = $(this).find('.option-text').html();
        $(this).children('.btn-shell').each(function(i) {
            option_obj[option_text][i] = $(this).find('.filter').prop('checked');
        })
    });
}

function startFilter()
{
    changeUrl();
	refreshOwnedCards();
    
    let skill_set = new Set();
    let attr_set = new Set();
    let race_set = new Set();
    let star_set = new Set();
    let charge_set = new Set();
    
    let filter_charge_set = new Set();
    
    let isSkillSelected = false;
    let isAttrSelected = false;
    let isRaceSelected = false;
    let isStarSelected = false;
    let isChargeSelected = false;
    
    if(keyword_search == false)
    {
        filter_set.clear();
    
        [skill_set, isSkillSelected] = getSelectedButton('filter');
        [attr_set, isAttrSelected] = getSelectedButton('attr');
        [race_set, isRaceSelected] = getSelectedButton('race');
        [star_set, isStarSelected] = getSelectedButton('star', true);
        [charge_set, isChargeSelected] = getSelectedButton('charge');
        
        $.each(monster_data, (index, monster) => {

            if( (!monster.star || monster.star <= 0) ||
                (isAttrSelected && !attr_set.has(monster.attribute)) || 
                (isRaceSelected && !race_set.has(monster.race)) || 
                (isStarSelected && !star_set.has(monster.star))) return;
            
            if(isSkillSelected) {
                let skill_num_array = [];
                
                $.each(monster.skill, (skill_index, monster_skill) => {
                    if(isChargeSelected && !charge_set.has(monster_skill.charge)) return;
                    
                    if(or_filter)       // OR
                    {
                        let isSkillMatch = false;
                        
                        $.each([...skill_set], (skill_set_index, selected_feat) => {
                            let isTagChecked = false;
                            
                            $.each(monster_skill.tag, (tag_index, tag) => {
                                if($.isArray(tag))      // Tag with round mark
                                {
                                    if(tag[0] == selected_feat) {
                                        if(selected_feat in option_obj)
                                        {
                                            if( (tag[1] == 1 && option_obj[selected_feat][0]) ||
                                                (tag[1] > 1  && option_obj[selected_feat][1]) ||
                                                (tag[1] == -1 && option_obj[selected_feat][2]) ||
                                                (!option_obj[selected_feat][0] && !option_obj[selected_feat][1] && !option_obj[selected_feat][2])
                                            ) 
                                            {
                                                isTagChecked = true;
                                            }
                                        }
                                        else isTagChecked = true;
                                    }
                                }
                                else      // Tag without round mark
                                {
                                    if(tag == selected_feat) {
                                        if(selected_feat in option_obj)
                                        {
                                            if( option_obj[selected_feat][0] ||
                                                (!option_obj[selected_feat][0] && !option_obj[selected_feat][1] && !option_obj[selected_feat][2])
                                            ) 
                                            {
                                                isTagChecked = true;
                                            }
                                        }
                                        else isTagChecked = true;
                                    }
                                }
                                
                                if(isTagChecked)
                                {
                                    isSkillMatch = true;
                                    return false;
                                }
                            })
                        })
                        
                        if(!isSkillMatch) return;
                    }
                    else       // AND
                    {
                        let isSkillMatch = true;
                        
                        $.each([...skill_set], (skill_set_index, selected_feat) => {
                            let isTagChecked = false;
                            $.each(monster_skill.tag, (tag_index, tag) => {
                                if($.isArray(tag))
                                {
                                    if(tag[0] == selected_feat) {
                                        if(selected_feat in option_obj)
                                        {
                                            if( (tag[1] == 1 && option_obj[selected_feat][0]) ||
                                                (tag[1] > 1  && option_obj[selected_feat][1]) ||
                                                (tag[1] == -1 && option_obj[selected_feat][2]) ||
                                                (!option_obj[selected_feat][0] && !option_obj[selected_feat][1] && !option_obj[selected_feat][2])
                                            ) 
                                            {
                                                isTagChecked = true;
                                                return false;
                                            }
                                        }
                                        else
                                        {
                                            isTagChecked = true;
                                            return false;
                                        }
                                    }
                                }
                                else
                                {
                                    if(tag == selected_feat) {
                                        if(selected_feat in option_obj)
                                        {
                                            if( option_obj[selected_feat][0] ||
                                                (!option_obj[selected_feat][0] && !option_obj[selected_feat][1] && !option_obj[selected_feat][2])
                                            ) 
                                            {
                                                isTagChecked = true;
                                                return false;
                                            }
                                        }
                                        else
                                        {
                                            isTagChecked = true;
                                            return false;
                                        }
                                    }
                                }
                            })
                                
                            if(!isTagChecked)
                            {
                                isSkillMatch = false;
                            }
                        })
                        
                        if(!isSkillMatch) return;
                    }
                    
                    let charge = ('reduce' in monster_skill) ? monster_skill.num - monster_skill.reduce : monster_skill.num;
                    
                    skill_num_array.push(skill_index);
                    filter_charge_set.add({'id': monster.id, 'num': skill_index, 'charge': charge});
                    
                })
                
                if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'attr': monster.attribute, 'race': monster.race, 'nums': skill_num_array});
            }
            else {
                let skill_num_array = [];
                
                $.each(monster.skill, (skill_index, monster_skill) => {
                    if(isChargeSelected && (!charge_set.has(monster_skill.charge) || monster_skill.name.length <= 0)) return;
                    
                    let charge = ('reduce' in monster_skill) ? monster_skill.num - monster_skill.reduce : monster_skill.num;
                    
                    skill_num_array.push(skill_index);
                    filter_charge_set.add({'id': monster.id, 'num': skill_index, 'charge': charge});
                })
                
                if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'attr': monster.attribute, 'race': monster.race, 'nums': skill_num_array});
            }
        })
    }
    else        // keyword search mode
    {
        filter_set.clear();
    
        let keyword_set = checkKeyword();
        if(!keyword_set) return;
        
        [attr_set, isAttrSelected] = getSelectedButton('attr');
        [race_set, isRaceSelected] = getSelectedButton('race');
        [star_set, isStarSelected] = getSelectedButton('star', true);
        [charge_set, isChargeSelected] = getSelectedButton('charge');
        
        $.each(monster_data, (index, monster) => {
            if( (!monster.star || monster.star <= 0) ||
                (isAttrSelected && !attr_set.has(monster.attribute)) || 
                (isRaceSelected && !race_set.has(monster.race)) || 
                (isStarSelected && !star_set.has(monster.star))) return;
            
            let skill_num_array = [];
            $.each(monster.skill, (skill_index, monster_skill) => {
                if(isChargeSelected && !charge_set.has(monster_skill.charge)) return;
                
                if(or_filter)
                {
                    let isKeywordChecked = false;
                    let skill_desc = textSanitizer(monster_skill.description);
                    
                    $.each([...keyword_set], (keyword_index, keyword) => {
                        if(skill_desc.includes(keyword))
                        {
                            isKeywordChecked = true;
                            return false;
                        }
                    })
                    
                    if(!isKeywordChecked) return;
                }
                else
                {
                    let isKeywordChecked = true;
                    let skill_desc = textSanitizer(monster_skill.description);
                    
                    $.each([...keyword_set], (keyword_index, keyword) => {
                        if(!skill_desc.includes(keyword))
                        {
                            isKeywordChecked = false;
                            return false;
                        }
                    })
                    
                    if(!isKeywordChecked) return;
                }
                
                let charge = ('reduce' in monster_skill) ? monster_skill.num - monster_skill.reduce : monster_skill.num;
                    
                skill_num_array.push(skill_index);
                filter_charge_set.add({'id': monster.id, 'num': skill_index, 'charge': charge});
            })
            
            if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'attr': monster.attribute, 'race': monster.race, 'nums': skill_num_array});
        })
    }
    
    $(".row.result-row").show();
    
    let monster_array = [...filter_set];
    let monster_charge_array = [...filter_charge_set];
    
    
    $("#result-row").html(() => {
        if(sort_by == 'id')
        {
            monster_array.sort((a, b) => { 
                return a.id - b.id;
            });
            
            let str = "";
            
            if(monster_array.length != 0)
            {
                $.each(monster_array, (index, monster) => {
                    
                    let sk_str = "";
                    
                    $.each(monster.nums, (num_index, skill_number) => {
                        sk_str += renderMonsterInfo(monster, skill_number);
                    })
                    
                    str += renderMonsterImage(monster, sk_str);
                });
            }
            else
            {
                str = `<div class='col-12' style='padding-top: 20px; text-align: center; color: #888888;'><h1>查無結果</h1></div>`;
            }
            return str;
        }
        else if(sort_by == 'charge')
        {
            monster_charge_array.sort((a, b) => { 
                return a.charge - b.charge;
            });
            
            let str = "";
            let now_cd = 0;
            
            if(monster_charge_array.length != 0)
            {
                $.each(monster_charge_array, (index, monster) => {
                    
                    if(monster.charge != now_cd && monster.charge > 0)
                    {
                        now_cd = monster.charge;
                        str += `
                            <div class='col-sm-12'><hr class='charge_num_hr'></div>
                            <div class='col-sm-12 charge_num_div'>&nbsp;${now_cd}</div>
                        `;
                    }
                    
                    let sk_str = "";
                    
                    sk_str += renderMonsterInfo(monster, monster.num);
                    
                    str += renderMonsterImage(monster, sk_str);
                });
            }
            else
            {
                str = `<div class='col-sm-12' style="text-align: center; color: #888888;"><h1>查無結果</h1></div>`;
            }
            return str;
        }
        else if(sort_by == 'attribute')
        {
            let attr_obj = {}
            $.each(attr_type_string, (attr_index, attr_str) => {
                attr_obj[attr_str] = [];
            })
            
            $.each(monster_array, (monster_index, monster) => {
                attr_obj[monster.attr].push(monster);
            })
            
            let str = "";
            
            if(monster_array.length != 0)
            {
                $.each(attr_obj, (attr_index, attr) => {
                    str += `
                        <div class='col-sm-12'><hr class='charge_num_hr'></div>
                        <div class='col-sm-12 charge_num_div' style='color: ${attr_color[attr_index]};'>
                            <img src='../tos_tool_data/img/monster/icon_${attr_zh_to_en[attr_index]}.png' style='max-width: 40px;'\>
                            &nbsp;${attr_index}
                        </div>
                    `;
                    
                    if(attr.length != 0) {
                        $.each(attr, (monster_index, monster) => {
                            let sk_str = "";
                        
                            $.each(monster.nums, (num_index, skill_number) => {
                                sk_str += renderMonsterInfo(monster, skill_number);
                            })
                            
                            str += renderMonsterImage(monster, sk_str);
                        });
                    }
                    else str += `<div class='col-12' style='text-align: center; color: #888888;'><h2>查無結果</h2></div>`;
                });
            }
            else
            {
                str = `<div class='col-12' style='padding-top: 20px; text-align: center; color: #888888;'><h1>查無結果</h1></div>`;
            }
            return str;
        }
        else if(sort_by == 'race')
        {
            let race_obj = {}
            $.each(race_type_string, (race_index, race_str) => {
                race_obj[race_str] = [];
            })
            
            $.each(monster_array, (monster_index, monster) => {
                race_obj[monster.race].push(monster);
            })
            
            let str = "";
            
            if(monster_array.length != 0)
            {
                $.each(race_obj, (race_index, race) => {
                    str += `
                        <div class='col-sm-12'><hr class='charge_num_hr'></div>
                        <div class='col-sm-12 charge_num_div'>
                            <img src='../tos_tool_data/img/monster/icon_${race_zh_to_en[race_index]}.png' style='max-width: 40px;'\>
                            &nbsp;${race_index}
                        </div>
                    `;
                    
                    if(race.length != 0) {
                        $.each(race, (monster_index, monster) => {
                            let sk_str = "";
                    
                            $.each(monster.nums, (num_index, skill_number) => {
                                sk_str += renderMonsterInfo(monster, skill_number);
                            })
                            
                            str += renderMonsterImage(monster, sk_str);
                        });
                    }
                    else str += `<div class='col-12' style='text-align: center; color: #888888;'><h2>查無結果</h2></div>`;
                });
            }
            else
            {
                str = `<div class='col-12' style='padding-top: 20px; text-align: center; color: #888888;'><h1>查無結果</h1></div>`;
            }
            return str;
        }
    });
    
    $('.result').tooltip({ 
        boundary: 'scrollParent', 
        placement: 'auto', 
        container: 'body'
    });
    
    $(".search_tag").html(() => {
        let tag_html = "";
        
        if(!keyword_search)
        {
            $.each([...skill_set], (skill_index, skill) => {
                
                if(option_obj[skill]) {
                    if( option_obj[skill].every(e => e === false) || 
                        option_obj[skill].every(e => e === true)) {
                        tag_html += renderTags([skill], 'skill');
                    }
                    else {
                        $.each(option_obj[skill], (option_index, option) => {
                            if(option) {
                                tag_html += `
                                    <div class="tag_wrapper">
                                        <div class="skill_tag" title="${skill} (${option_text[option_index]})">${skill} <font style="color: #CCCCFF; font-size: 0.8em;">(${option_text[option_index]})</font>
                                        </div>
                                    </div>
                                `;
                            }
                        })
                    }
                }
                else tag_html += renderTags([skill], 'skill');
            })
        }
        
        tag_html += renderTags(attr_set, 'genre', '屬性');
        tag_html += renderTags(race_set, 'genre');
        tag_html += renderTags(star_set, 'genre', ' ★');
        tag_html += renderTags(charge_set, 'genre');
        
        return tag_html;
    });
    
    
    $('[data-toggle=popover]').popover({
      container: 'body',
      html: true,
      trigger: 'focus',
      placement: 'bottom'
    });
    
    jumpTo("result_title");
}

function renderMonsterInfo(monster, skill_number) {
    const skill = monster_data.find((element) => {
        return element.id == monster.id;
    }).skill[skill_number];
    
    let sk_str = '';
    
    sk_str += `<div class='row'>`;
    
    switch(skill.type) {
        case 'normal':
            sk_str += `<div class='skill_tooltip skill_name col-9 col-sm-9 mb-1'>`;
        break;
        case 'refine':
            sk_str += `<div class='skill_tooltip skill_name_refine col-9 col-sm-9 mb-1'><img src='../tos_tool_data/img/monster/refine_${skill.refine}.png' />&nbsp;`;
        break;
        case 'recall':
            sk_str += `<div class='skill_tooltip skill_name_recall col-9 col-sm-9 mb-1'><img src='../tos_tool_data/img/monster/recall.png' />&nbsp;`;
        break;
        default:
            sk_str += `<div class='skill_tooltip skill_name col-9 col-sm-9 mb-1'>`;
    }
    sk_str += `${skill.name}</div>`
    
    let cd_str = 'reduce' in skill ? skill.num+" → "+(skill.num-skill.reduce) : skill.num <= 0 ? '-' : skill.num
    sk_str += `<div class='skill_tooltip skill_charge col-3 col-sm-3 mb-1'>${skill.charge}&nbsp;${cd_str}</div>`
    
    sk_str += `</div>`;
    
    if('combine' in skill)
    {
        let combine_str = ''
        $.each(skill.combine.member, (combine_index, member) => {
            combine_str += `<img src='../tos_tool_data/img/monster/${member}.png'\> ${combine_index !== skill.combine.member.length-1 ? ` + ` : ``}`;
        })
        
        combine_str += ` → <img src='../tos_tool_data/img/monster/${skill.combine.out}.png'\>`;
        
        sk_str += `
            <div class='row'>
                <div class='skill_tooltip col-sm-12'><hr></div>
            </div>
            <div class='row'>
                <div class='skill_tooltip skill_combine col-sm-12'>${combine_str}</div>
            </div>
        `;
    }
    
    if('transform' in skill)
    {
        let transform_str = ''
        transform_str += `<img src='../tos_tool_data/img/monster/${monster.id}.png'\>`;
        
        transform_str += ` → <img src='../tos_tool_data/img/monster/${skill.transform}.png'\>`;
        
        sk_str += `
            <div class='row'>
                <div class='skill_tooltip col-sm-12'><hr></div>
            </div>
            <div class='row'>
                <div class='skill_tooltip skill_transform col-sm-12'>${transform_str}</div>
            </div>
        `;
    }
    
    sk_str += `
        <div class='row'>
            <div class='skill_tooltip col-sm-12'><hr></div>
        </div>
        <div class='row'>
            <div class='skill_tooltip skill_description col-sm-12'>${skill.description}</div>
        </div>
    `;  

    return sk_str;
}

function renderMonsterImage(monster, tooltip_content) {
    const monster_attr = monster_data.find((element) => {
        return element.id == monster.id;
    }).attribute;
	
	let cd_str = '';
	let darken = '';
	
	if (owned_cards) {
		const owned = owned_cards.find((element) => {
			return element.id == monster.id;
		})
		
		if (!owned) {
			darken = "filter: brightness(0.5);";
		}
	}

	$.each(monster.nums, (num_index, skill_number) => {
		if (cd_str) {
			cd_str += "<br>";
		}
		const skill = monster_data.find((element) => {
			return element.id == monster.id;
		}).skill[skill_number];
		cd_str += skill.charge + " ";
		cd_str += 'reduce' in skill ? skill.num+" → "+(skill.num-skill.reduce) : skill.num <= 0 ? '-' : skill.num;
	});
	
    return `
        <div class='col-3 col-md-2 col-lg-1 result'>
            <img style='${darken}' class='monster_img' src='../tos_tool_data/img/monster/${monster.id}.png' onerror='this.src="../tos_tool_data/img/monster/noname_${attr_zh_to_en[monster_attr]}.png"' tabindex=${monster.id.toString().replace('?', '')} data-toggle='popover' data-title='' data-content="${tooltip_content}"></img>
			<div class='monsterId'>
                <a href='https://tos.fandom.com/en/wiki/${monster.id}' target='_blank'>${cd_str}</a>
            </div>
            <div class='monsterId'>
                <a href='https://tos.fandom.com/en/wiki/${monster.id}' target='_blank'>${paddingZeros(monster.id, 3)}</a>
            </div>
			<div class='monsterId'>
                <a href='https://tos.fandom.com/zh/wiki/${monster.id}' target='_blank'>${paddingZeros(monster.id, 3)}</a>
            </div>
        </div>
    `;
}

function sortByChange()
{
    let sort_by_next_index = (sort_by_method.findIndex(element => element[0] === sort_by) + 1) % sort_by_method.length
    
    sort_by = sort_by_method[sort_by_next_index][0]
    $("#sort_by_result").text(sort_by_method[sort_by_next_index][1])
}

function changeUrl()
{
    let search_str = `${!keyword_search ? `search=${encode(".filter-row", skill_num)}` : `keyword=${escape(textSanitizer($('#keyword-input').val()))}`}`
    let attr_str = `attr=${encode(".attr-row", attr_num)}`
    let race_str = `race=${encode(".race-row", race_num)}`
    let star_str = `star=${encode(".star-row", star_num)}`
    let charge_str = `chrg=${encode(".charge-row", charge_num)}`
    let or_str = `or=${or_filter ? `1` : `0`}`
    
    window.history.pushState(null, null, `?${search_str}&${attr_str}&${race_str}&${star_str}&${charge_str}&${or_str}`);
}

function readUrl()
{   
    let code_array = location.search.split("&").map(x => x.split("=")[1]);
    let code_name_array = location.search.split("?")[1].split("&").map(x => x.split("=")[0]);
    
    if(code_array.length != 6)
    {
        errorAlert(1);
        return;
    }
    
    let code_name_1 = ["search", "attr", "race", "star", "chrg", "or"];
    let code_name_2 = ["keyword", "attr", "race", "star", "chrg", "or"];
    
    let isCodeNameFit = true;
    $.each(code_name_array, (index, code) => {
        if( code_name_array[index] !== code_name_1[index] && 
            code_name_array[index] !== code_name_2[index] )
        {
            isCodeNameFit = false;
            return false;
        }
    })
    
    if(!isCodeNameFit) {
        errorAlert(1);
        return;
    }
    
    
    if(code_name_array[0] === code_name_1[0])
    {
        let skill_code = decode(code_array[0]);
        setButtonFromUrl(".filter-row", skill_code, clearFilterButtonRow('filter'));
    }
    else
    {
        let skill_keyword = code_array[0];
        setInputFromUrl(".keyword-input", unescape(skill_keyword));
        
        $("#keyword-switch").click();
        keywordSwitch();
    }
    
    let attr_code = decode(code_array[1]);
    setButtonFromUrl(".attr-row", attr_code, clearFilterButtonRow('attr'));
    
    let race_code = decode(code_array[2]);
    setButtonFromUrl(".race-row", race_code, clearFilterButtonRow('race'));
    
    let star_code = decode(code_array[3]);
    setButtonFromUrl(".star-row", star_code, clearFilterButtonRow('star'));
    
    let chrg_code = decode(code_array[4]);
    setButtonFromUrl(".charge-row", chrg_code, clearFilterButtonRow('charge'));
    
    let and_or_code = code_array[5];
    and_or_code[0] == "0" && andOrChange();
    
    
    startFilter();
    
    window.history.pushState(null, null, location.pathname);    // clear search parameters
}